import React from "react";
import Settings from "../containers/Settings";

const request = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error && body.error.message ? body.error.message : "Pyyntö epäonnistui");
  }
  return response.status === 204 ? null : response.json();
};

export default class ConGroupList extends React.Component {
  state = { groups: [], matrices: [], selectedMatrixId: "", slug: "", selectedPorts: [], executeInputs: {}, error: "", loading: true };

  componentDidMount() { this.load(); }

  async load() {
    try {
      const [groups, matrices] = await Promise.all([request("/rest/con-groups"), request("/rest/matrices")]);
      this.setState({ groups, matrices, selectedMatrixId: this.state.selectedMatrixId || (matrices[0] && matrices[0].id) || "", loading: false, error: "" });
    } catch (error) { this.setState({ error: error.message, loading: false }); }
  }

  selectedMatrix() { return this.state.matrices.find(matrix => matrix.id === this.state.selectedMatrixId); }

  togglePort(id) {
    this.setState(state => ({ selectedPorts: state.selectedPorts.includes(id) ? state.selectedPorts.filter(portId => portId !== id) : [...state.selectedPorts, id] }));
  }

  async create(event) {
    event.preventDefault();
    try {
      await request("/rest/con-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: this.state.slug, matrixId: this.state.selectedMatrixId, conPortIds: this.state.selectedPorts }) });
      this.setState({ slug: "", selectedPorts: [], error: "" });
      this.load();
    } catch (error) { this.setState({ error: error.message }); }
  }

  async execute(group) {
    const cpuPortId = this.state.executeInputs[group.id];
    if (!cpuPortId) return this.setState({ error: "Valitse ensin input ryhmälle." });
    try {
      await request(`/rest/con-groups/${group.id}/execute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cpuPortId }) });
      this.setState({ error: "" });
    } catch (error) { this.setState({ error: error.message }); }
  }

  async remove(group) {
    if (!window.confirm(`Poistetaanko ryhmä ${group.slug}?`)) return;
    try { await request(`/rest/con-groups/${group.id}`, { method: "DELETE" }); this.load(); }
    catch (error) { this.setState({ error: error.message }); }
  }

  render() {
    const matrix = this.selectedMatrix();
    const selectedCount = this.state.selectedPorts.length;
    const styles = {
      page: { maxWidth: "980px", paddingBottom: "48px" },
      intro: { color: "#5d6b78", fontSize: "16px", marginBottom: "24px" },
      card: { border: "1px solid #dfe5eb", borderRadius: "10px", boxShadow: "0 2px 8px rgba(24, 39, 75, .06)", marginBottom: "28px" },
      cardHeader: { padding: "18px 22px", borderBottom: "1px solid #e8edf1", background: "#f8fafc", borderRadius: "10px 10px 0 0" },
      cardBody: { padding: "22px" },
      fieldLabel: { display: "block", fontWeight: 600, marginBottom: "7px", color: "#334155" },
      portGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px", marginTop: "10px" },
      port: { display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: "1px solid #d9e1e8", borderRadius: "8px", cursor: "pointer", background: "white", marginBottom: 0 },
      selectedPort: { borderColor: "#1677c8", background: "#eff7ff" },
      muted: { color: "#66788a", fontSize: "14px" },
      group: { border: "1px solid #dfe5eb", borderRadius: "10px", padding: "18px", marginBottom: "12px", background: "white" },
      groupName: { margin: 0, fontSize: "18px", fontWeight: 600 },
      badge: { display: "inline-block", marginTop: "7px", padding: "3px 8px", borderRadius: "999px", background: "#eef2f6", color: "#52606d", fontSize: "13px" }
    };
    return <Settings active="con-groups">
      <div style={styles.page}>
      <h1>Output-ryhmät</h1>
      <p style={styles.intro}>Kokoa usein yhdessä vaihtuvat näytöt ryhmäksi. Ryhmän suoritus vaihtaa kaikki sen outputit samaan inputiin.</p>
      {this.state.error && <div className="alert alert-danger">{this.state.error}</div>}
      <form style={styles.card} onSubmit={event => this.create(event)}>
        <div style={styles.cardHeader}><h2 style={{ margin: 0, fontSize: "22px" }}>Uusi output-ryhmä</h2><div style={styles.muted}>Valitse matriisi ja siihen kuuluvat outputit.</div></div>
        <div style={styles.cardBody}>
        <div className="row"><div className="col-md-6 mb-3">
        <label style={styles.fieldLabel}>Ryhmän nimi</label>
        <input className="form-control" placeholder="Esim. Sali ja aula" required value={this.state.slug} onChange={event => this.setState({ slug: event.target.value })} />
        </div><div className="col-md-6 mb-3">
        <label style={styles.fieldLabel}>Matriisi</label>
        <select className="form-control" value={this.state.selectedMatrixId} onChange={event => this.setState({ selectedMatrixId: event.target.value, selectedPorts: [] })}>
          {this.state.matrices.map(item => <option key={item.id} value={item.id}>{item.slug}</option>)}
        </select>
        </div></div>
        <div style={styles.fieldLabel}>Outputit <span style={styles.muted}>— valittu {selectedCount}</span></div>
        <div style={styles.portGrid}>{matrix && matrix.conPorts.map(port => {
          const selected = this.state.selectedPorts.includes(port.id);
          return <label key={port.id} style={{ ...styles.port, ...(selected ? styles.selectedPort : {}) }}><input type="checkbox" checked={selected} onChange={() => this.togglePort(port.id)} /><span><strong>{port.portNum}.</strong> {port.slug || `Output ${port.portNum}`}</span></label>;
        })}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "22px", gap: "12px", flexWrap: "wrap" }}><span style={styles.muted}>{selectedCount ? `${selectedCount} outputia lisätään ryhmään.` : "Valitse vähintään yksi output."}</span><button className="btn btn-success" disabled={!matrix || !selectedCount}>Luo output-ryhmä</button></div>
        </div>
      </form>
      <h2 style={{ fontSize: "24px", marginBottom: "14px" }}>Suorita output-ryhmä</h2>
      {this.state.groups.map(group => {
        const groupMatrix = this.state.matrices.find(item => group.matrix && item.id === group.matrix.id);
        return <div style={styles.group} key={group.id}>
          <div className="row align-items-center"><div className="col-md-5 mb-3 mb-md-0"><h3 style={styles.groupName}>{group.slug}</h3><span style={styles.badge}>{group.conPorts.length} outputia</span><div style={{ ...styles.muted, marginTop: "8px" }}>{group.conPorts.map(port => port.slug || `Output ${port.portNum}`).join(", ")}</div></div>
          <div className="col-md-4 mb-3 mb-md-0"><label style={styles.fieldLabel}>Vaihda inputiin</label><select className="form-control" value={this.state.executeInputs[group.id] || ""} onChange={event => this.setState(state => ({ executeInputs: { ...state.executeInputs, [group.id]: event.target.value } }))}><option value="">Valitse input</option>{groupMatrix && groupMatrix.cpuPorts.map(port => <option key={port.id} value={port.id}>{port.portNum}. {port.slug || `Input ${port.portNum}`}</option>)}</select></div>
          <div className="col-md-3"><button className="btn btn-primary mr-2" onClick={() => this.execute(group)}>Suorita</button><button className="btn btn-outline-danger" onClick={() => this.remove(group)}>Poista</button></div></div>
        </div>;
      })}
      {!this.state.loading && !this.state.groups.length && <div style={{ ...styles.group, ...styles.muted, textAlign: "center", padding: "28px" }}>Ei output-ryhmiä vielä. Luo ensimmäinen ryhmä yllä.</div>}
      </div>
    </Settings>;
  }
}
