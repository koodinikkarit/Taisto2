import React from "react";
import Settings from "./Settings";

const formatFinnishLocalTime = value => value
  ? new Date(value).toLocaleString("fi-FI", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "";

const toLocalDateTimeInput = value => {
  if (!value) return "";
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

export default class ApiKeySettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: true, keys: [], error: "", copiedId: "", durationMinutes: "60", anonymousActive: false, anonymousUntil: "", newKeyName: "", newKeyValidity: "30" };
  }

  componentDidMount() {
    this.load();
  }

  load() {
    fetch("/settings/api-key/config", { credentials: "same-origin" })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("API-avaimia ei voitu hakea.")))
      .then(status => this.setState({ loading: false, keys: status.keys || [], anonymousActive: status.anonymousActive, anonymousUntil: status.anonymousUntil || "", error: "" }))
      .catch(error => this.setState({ loading: false, error: error.message }));
  }

  create() {
    fetch("/settings/api-key/config", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: this.state.newKeyName, expiresInDays: this.state.newKeyValidity }) })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("API-avainta ei voitu luoda.")))
      .then(key => this.setState(state => ({ keys: state.keys.concat(key), newKeyName: "", error: "" })))
      .catch(error => this.setState({ error: error.message }));
  }

  remove(id) {
    if (!window.confirm("Poistetaanko tämä API-avain? Sitä käyttävät integraatiot lakkaavat toimimasta.")) return;
    fetch(`/settings/api-key/config/${id}`, { method: "DELETE", credentials: "same-origin" })
      .then(response => response.ok ? this.setState(state => ({ keys: state.keys.filter(key => key.id !== id), copiedId: "", error: "" })) : Promise.reject(new Error("API-avainta ei voitu poistaa.")))
      .catch(error => this.setState({ error: error.message }));
  }

  copy(entry) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(entry.key).then(() => this.setState({ copiedId: entry.id }));
  }

  setEnabled(entry, enabled) {
    fetch(`/settings/api-key/config/${entry.id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled })
    })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("API-avaimen tilaa ei voitu muuttaa.")))
      .then(updated => this.setState(state => ({ keys: state.keys.map(key => key.id === updated.id ? updated : key), error: "" })))
      .catch(error => this.setState({ error: error.message }));
  }

  saveName(entry) {
    fetch(`/settings/api-key/config/${entry.id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: entry.name })
    })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("API-avaimen nimeä ei voitu tallentaa.")))
      .then(updated => this.setState(state => ({ keys: state.keys.map(key => key.id === updated.id ? updated : key), error: "" })))
      .catch(error => this.setState({ error: error.message }));
  }

  saveExpiration(entry, expiresAt) {
    const utcExpiration = expiresAt ? new Date(expiresAt).toISOString() : "";
    fetch(`/settings/api-key/config/${entry.id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresAt: utcExpiration })
    })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Voimassaoloaikaa ei voitu tallentaa.")))
      .then(updated => this.setState(state => ({ keys: state.keys.map(key => key.id === updated.id ? updated : key), error: "" })))
      .catch(error => this.setState({ error: error.message }));
  }

  allowAnonymous() {
    fetch("/settings/api-key/anonymous", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes: Number(this.state.durationMinutes) })
    })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Anonyymiä käyttöä ei voitu sallia.")))
      .then(status => this.setState({ anonymousActive: true, anonymousUntil: status.anonymousUntil, error: "" }))
      .catch(error => this.setState({ error: error.message }));
  }

  disableAnonymous() {
    fetch("/settings/api-key/anonymous", { method: "DELETE", credentials: "same-origin" })
      .then(response => response.ok ? this.setState({ anonymousActive: false, anonymousUntil: "", error: "" }) : Promise.reject(new Error("Anonyymiä käyttöä ei voitu katkaista.")))
      .catch(error => this.setState({ error: error.message }));
  }

  render() {
    return <Settings active="api-key">
      <div style={{ maxWidth: "920px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
          <div><h1 style={{ marginBottom: "6px" }}>REST API-avaimet</h1><p style={{ color: "#64748b", margin: 0 }}>Avainta vaaditaan kaikissa REST-pyynnöissä, jotka muuttavat tai suorittavat tietoja.</p></div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}><input className="form-control" style={{ width: "220px" }} maxLength="80" placeholder="Avaimen nimi" value={this.state.newKeyName} onChange={event => this.setState({ newKeyName: event.target.value })} /><select className="form-control" style={{ width: "170px" }} value={this.state.newKeyValidity} onChange={event => this.setState({ newKeyValidity: event.target.value })}><option value="">Ei vanhene</option><option value="1">1 päivä</option><option value="7">1 viikko</option><option value="30">30 päivää</option><option value="90">90 päivää</option><option value="365">1 vuosi</option></select><button className="btn btn-primary" onClick={() => this.create()}>Luo uusi API-avain</button></div>
        </div>
        {this.state.error && <div className="alert alert-danger">{this.state.error}</div>}
        <div className="card" style={{ marginBottom: "18px" }}><div className="card-block">
          <h2 style={{ marginTop: 0 }}>Anonyymi muutospääsy</h2>
          <p style={{ color: "#64748b" }}>Salli muuttavat REST-pyynnöt määräajaksi ilman API-avainta. Pääsy sulkeutuu automaattisesti valitun ajan jälkeen.</p>
          {this.state.anonymousActive ? <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="alert alert-warning" style={{ margin: 0 }}>Anonyymi käyttö on sallittu {formatFinnishLocalTime(this.state.anonymousUntil)} asti.</div>
            <button className="btn btn-danger" onClick={() => this.disableAnonymous()}>Katkaise nyt</button>
          </div> : <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <select className="form-control" style={{ width: "190px" }} value={this.state.durationMinutes} onChange={event => this.setState({ durationMinutes: event.target.value })}><option value="15">15 minuuttia</option><option value="60">1 tunti</option><option value="240">4 tuntia</option><option value="1440">1 päivä</option><option value="10080">1 viikko</option><option value="43200">30 päivää</option></select>
            <button className="btn btn-warning" onClick={() => this.allowAnonymous()}>Salli anonyymisti</button>
          </div>}
        </div></div>
        {this.state.loading ? <div className="card"><div className="card-block">Ladataan…</div></div> : this.state.keys.length === 0 ?
          <div className="alert alert-info">API-avaimia ei ole. REST-muutospyynnöt estetään, kunnes luot avaimen.</div> :
          <div className="list-group">{this.state.keys.map(entry => <div className="list-group-item" key={entry.id} style={{ display: "block", opacity: entry.enabled === false ? .58 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "240px" }}><div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}><input className="form-control" style={{ minHeight: "36px" }} maxLength="80" value={entry.name || ""} onChange={event => this.setState(state => ({ keys: state.keys.map(key => key.id === entry.id ? Object.assign({}, key, { name: event.target.value }) : key) }))} /><button className="btn btn-secondary" onClick={() => this.saveName(entry)}>Tallenna nimi</button></div><code style={{ display: "block", padding: "9px", background: "#f4f7fa", borderRadius: "6px", wordBreak: "break-all" }}>{entry.key}</code><div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}><label style={{ margin: 0 }}>Voimassa:</label><input type="datetime-local" className="form-control" style={{ width: "220px", minHeight: "36px" }} value={toLocalDateTimeInput(entry.expiresAt)} onChange={event => this.setState(state => ({ keys: state.keys.map(key => key.id === entry.id ? Object.assign({}, key, { expiresAt: event.target.value }) : key) }))} /><button className="btn btn-secondary" onClick={() => this.saveExpiration(entry, entry.expiresAt || "")}>Tallenna</button>{entry.expiresAt && <button className="btn btn-default" onClick={() => this.saveExpiration(entry, "")}>Ei vanhene</button>}</div><small style={{ display: "block", color: entry.expiresAt && new Date(entry.expiresAt).getTime() <= Date.now() ? "#b42318" : "#64748b" }}>Luotu {formatFinnishLocalTime(entry.createdAt)} · {entry.expiresAt ? (new Date(entry.expiresAt).getTime() <= Date.now() ? "Vanhentunut" : `Vanhenee ${formatFinnishLocalTime(entry.expiresAt)}`) : "Ei vanhene"}</small><small style={{ display: "block", marginTop: "3px", color: "#40566b" }}>Käyttökertoja {Number(entry.useCount || 0)} · {entry.lastUsedAt ? `Viimeksi käytetty ${formatFinnishLocalTime(entry.lastUsedAt)}` : "Ei ole käytetty"}</small></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}><label style={{ margin: 0 }}><input type="checkbox" checked={entry.enabled !== false} onChange={event => this.setEnabled(entry, event.target.checked)} /> Käytössä</label><button className="btn btn-secondary" onClick={() => this.copy(entry)}>{this.state.copiedId === entry.id ? "Kopioitu" : "Kopioi"}</button><button className="btn btn-outline-danger" onClick={() => this.remove(entry.id)}>Poista</button></div>
            </div>
          </div>)}</div>}
        <div className="card" style={{ marginTop: "18px" }}><div className="card-block"><h2 style={{ marginTop: 0 }}>Käyttö ja tallennus</h2><pre style={{ marginBottom: "16px", whiteSpace: "pre-wrap" }}>curl -H "X-API-Key: TAISTO_API_KEY" -H "Content-Type: application/json" ...</pre><p style={{ margin: 0, color: "#64748b" }}>Avaimet ja niiden käyttötiedot tallennetaan SQLite-tietokannan <code>rest_api_keys</code>-tauluun. Tietokanta on paikallisesti polussa <code>database/taisto.sqlite</code> ja Dockerissa polussa <code>/usr/src/database/taisto.sqlite</code>. Avaimet säilytetään pyynnöstä selväkielisinä, jotta ne voidaan näyttää tällä sivulla uudelleen.</p></div></div>
      </div>
    </Settings>;
  }
}
