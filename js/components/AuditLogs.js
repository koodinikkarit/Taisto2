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
  state = { rows: [], total: 0, retentionDays: 90, loading: true, error: "" };

  componentDidMount() { this.load(); }

  load() {
    this.setState({ loading: true });
    fetch("/settings/audit-logs/data?limit=200", { credentials: "same-origin" })
      .then(response => response.ok ? response.json() : Promise.reject(new Error(this.context.t("auditFetchError"))))
      .then(result => this.setState({ rows: result.rows || [], total: result.total || 0, retentionDays: Number(result.retentionDays == null ? 90 : result.retentionDays), loading: false, error: "" }))
      .catch(error => this.setState({ loading: false, error: error.message }));
  }

  render() {
    const { language, t } = this.context;
    const styles = {
      page: { maxWidth: "1180px", paddingBottom: "48px" },
      intro: { color: "#64748b", marginBottom: "20px" },
      card: { border: "1px solid #dfe5eb", borderRadius: "10px", background: "white", overflow: "hidden" },
      table: { width: "100%", minWidth: "900px", margin: 0 },
      badge: success => ({ display: "inline-block", padding: "3px 9px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, color: success ? "#166534" : "#991b1b", background: success ? "#dcfce7" : "#fee2e2" }),
      code: { whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: "460px", marginTop: "8px", fontSize: "12px" }
    };
    return <Settings active="audit-logs">
      <div style={styles.page}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div><h1 style={{ marginBottom: "6px" }}>{t("auditLog")}</h1><p style={styles.intro}>{t("auditIntro")} {this.state.total} {t("eventCount")}.</p></div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span className="badge badge-default" style={{ padding: "9px 12px", fontSize: "13px" }}>{t("auditRetentionLabel")}: {this.state.retentionDays === 0 ? t("auditRetentionForever") : `${this.state.retentionDays} ${t("days")}`}</span>
            <button className="btn btn-secondary" disabled={this.state.loading} onClick={() => this.load()}>{this.state.loading ? t("refreshing") : t("refresh")}</button>
          </div>
        </div>
        {this.state.error && <div className="alert alert-danger">{this.state.error}</div>}
        <div style={styles.card}>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-hover" style={styles.table}>
              <thead><tr><th>{t("time")}</th><th>{t("status")}</th><th>{t("action")}</th><th>{t("actor")}</th><th>{t("target")}</th><th>{t("ipAddress")}</th></tr></thead>
              <tbody>{this.state.rows.map(entry => <tr key={entry.id}>
                <td style={{ whiteSpace: "nowrap" }}>{formatLocalTime(entry.createdAt, language)}</td>
                <td><span style={styles.badge(entry.success)}>{entry.success ? t("succeeded") : `${t("error")} ${entry.statusCode}`}</span></td>
                <td><strong>{entry.action}</strong><div style={{ color: "#64748b", fontSize: "12px" }}>{entry.method} · HTTP {entry.statusCode}</div></td>
                <td>{actorLabel(entry)}{entry.actorId && <div style={{ color: "#64748b", fontSize: "12px" }}>{entry.actorId}</div>}</td>
                <td><code>{entry.path}</code>{entry.details && Object.keys(entry.details).length > 0 && <details><summary style={{ cursor: "pointer", color: "#1677c8" }}>{t("details")}</summary><pre style={styles.code}>{JSON.stringify(entry.details, null, 2)}</pre></details>}</td>
                <td>{entry.ipAddress || "—"}</td>
              </tr>)}</tbody>
            </table>
          </div>
          {!this.state.loading && this.state.rows.length === 0 && <div style={{ padding: "28px", textAlign: "center", color: "#64748b" }}>{t("noAuditEvents")}</div>}
        </div>
        <p style={{ color: "#64748b", fontSize: "13px", marginTop: "12px" }}>{t("auditRetention")}</p>
      </div>
    </Settings>;
  }
}
