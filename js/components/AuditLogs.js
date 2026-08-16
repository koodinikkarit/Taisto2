import React from "react";
import Settings from "./Settings";
import { I18nContext } from "../i18n";

const formatLocalTime = (value, language) => value
  ? new Date(value).toLocaleString(language === "en" ? "en-GB" : "fi-FI", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  })
  : "";

const actorLabel = entry => entry.actorName || ({
  api_key: "API-avain",
  anonymous: "Anonyymi REST-käyttö",
  session: "Kirjautunut käyttäjä",
  web: "Taisto-verkkokäyttäjä",
  websocket: "Taisto WebSocket",
  invalid_api_key: "Virheellinen API-avain",
  unauthenticated: "Tunnistamaton"
}[entry.actorType] || entry.actorType);

export default class AuditLogs extends React.Component {
  static contextType = I18nContext;
  state = {
    rows: [], total: 0, unfilteredTotal: 0, retentionDays: 90, loading: true, error: "",
    filters: { search: "", action: "", success: "", actorType: "", from: "", to: "" }
  };

  componentDidMount() { this.load(); }

  load() {
    this.setState({ loading: true });
    const parameters = new URLSearchParams({ limit: "200" });
    Object.keys(this.state.filters).forEach(key => {
      const value = this.state.filters[key];
      if (!value) return;
      if (key === "from" || key === "to") {
        const timestamp = new Date(value);
        if (Number.isFinite(timestamp.getTime())) parameters.set(key, timestamp.toISOString());
      } else {
        parameters.set(key, value);
      }
    });
    fetch(`/settings/audit-logs/data?${parameters.toString()}`, { credentials: "same-origin" })
      .then(response => response.ok ? response.json() : Promise.reject(new Error(this.context.t("auditFetchError"))))
      .then(result => this.setState({ rows: result.rows || [], total: result.total || 0, unfilteredTotal: result.unfilteredTotal || 0, retentionDays: Number(result.retentionDays == null ? 90 : result.retentionDays), loading: false, error: "" }))
      .catch(error => this.setState({ loading: false, error: error.message }));
  }

  updateFilter(name, value) {
    this.setState(state => ({ filters: Object.assign({}, state.filters, { [name]: value }) }));
  }

  clearFilters() {
    this.setState({ filters: { search: "", action: "", success: "", actorType: "", from: "", to: "" } }, () => this.load());
  }

  render() {
    const { language, t } = this.context;
    const styles = {
      page: { maxWidth: "1180px", paddingBottom: "48px" },
      intro: { color: "#64748b", marginBottom: "20px" },
      card: { border: "1px solid #dfe5eb", borderRadius: "10px", background: "white", overflow: "hidden" },
      badge: success => ({ display: "inline-block", padding: "3px 9px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, color: success ? "#166534" : "#991b1b", background: success ? "#dcfce7" : "#fee2e2" }),
      code: { whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: "460px", marginTop: "8px", fontSize: "12px" }
    };
    return <Settings active="audit-logs">
      <div style={styles.page}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div><h1 style={{ marginBottom: "6px" }}>{t("auditLog")}</h1><p style={styles.intro}>{t("auditIntro")} {this.state.total} / {this.state.unfilteredTotal} {t("eventCount")}.</p></div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span className="badge badge-default" style={{ padding: "9px 12px", fontSize: "13px" }}>{t("auditRetentionLabel")}: {this.state.retentionDays === 0 ? t("auditRetentionForever") : `${this.state.retentionDays} ${t("days")}`}</span>
            <button className="btn btn-secondary" disabled={this.state.loading} onClick={() => this.load()}>{this.state.loading ? t("refreshing") : t("refresh")}</button>
          </div>
        </div>
        {this.state.error && <div className="alert alert-danger">{this.state.error}</div>}
        <form className="taisto-audit-filters" onSubmit={event => { event.preventDefault(); this.load(); }}>
          <div className="taisto-audit-filter-grid">
            <label>{t("auditSearch")}<input className="form-control" type="search" value={this.state.filters.search} placeholder={t("auditSearchPlaceholder")} onChange={event => this.updateFilter("search", event.target.value)} /></label>
            <label>{t("auditActionFilter")}<input className="form-control" value={this.state.filters.action} placeholder="matrix.video.set" onChange={event => this.updateFilter("action", event.target.value)} /></label>
            <label>{t("auditResultFilter")}<select className="form-control" value={this.state.filters.success} onChange={event => this.updateFilter("success", event.target.value)}><option value="">{t("all")}</option><option value="true">{t("succeeded")}</option><option value="false">{t("failed")}</option></select></label>
            <label>{t("auditActorTypeFilter")}<select className="form-control" value={this.state.filters.actorType} onChange={event => this.updateFilter("actorType", event.target.value)}><option value="">{t("all")}</option><option value="user">{t("auditActorUser")}</option><option value="api_key">{t("auditActorApiKey")}</option><option value="anonymous">{t("auditActorAnonymous")}</option><option value="websocket">WebSocket</option><option value="web">Web</option><option value="invalid_api_key">{t("auditActorInvalidKey")}</option><option value="unauthenticated">{t("auditActorUnauthenticated")}</option></select></label>
            <label>{t("auditFrom")}<input className="form-control" type="datetime-local" value={this.state.filters.from} onChange={event => this.updateFilter("from", event.target.value)} /></label>
            <label>{t("auditTo")}<input className="form-control" type="datetime-local" value={this.state.filters.to} onChange={event => this.updateFilter("to", event.target.value)} /></label>
          </div>
          <div className="taisto-audit-filter-actions"><button type="submit" className="btn btn-primary" disabled={this.state.loading}>{t("applyFilters")}</button><button type="button" className="btn btn-default" disabled={this.state.loading} onClick={() => this.clearFilters()}>{t("clearFilters")}</button></div>
        </form>
        <div style={styles.card}>
          <div className="taisto-audit-list">{this.state.rows.map(entry => <article className="taisto-audit-entry" key={entry.id}>
            <div className="taisto-audit-entry-header">
              <div><strong>{entry.action}</strong><div className="taisto-audit-secondary">{entry.method} · HTTP {entry.statusCode}</div></div>
              <span style={styles.badge(entry.success)}>{entry.success ? t("succeeded") : `${t("error")} ${entry.statusCode}`}</span>
            </div>
            <div className="taisto-audit-fields">
              <div><span className="taisto-audit-label">{t("time")}</span>{formatLocalTime(entry.createdAt, language)}</div>
              <div><span className="taisto-audit-label">{t("actor")}</span>{actorLabel(entry)}{entry.actorId && <div className="taisto-audit-secondary taisto-audit-break">{entry.actorId}</div>}</div>
              <div><span className="taisto-audit-label">{t("target")}</span><code className="taisto-audit-break">{entry.path}</code></div>
              <div><span className="taisto-audit-label">{t("ipAddress")}</span>{entry.ipAddress || "—"}</div>
            </div>
            {entry.details && Object.keys(entry.details).length > 0 && <details className="taisto-audit-details"><summary>{t("details")}</summary><pre style={styles.code}>{JSON.stringify(entry.details, null, 2)}</pre></details>}
          </article>)}</div>
          {!this.state.loading && this.state.rows.length === 0 && <div style={{ padding: "28px", textAlign: "center", color: "#64748b" }}>{t("noAuditEvents")}</div>}
        </div>
        <p style={{ color: "#64748b", fontSize: "13px", marginTop: "12px" }}>{t("auditRetention")}</p>
      </div>
    </Settings>;
  }
}
