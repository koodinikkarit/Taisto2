import React from "react";
import Settings from "./Settings";
import { useI18n } from "../i18n";

const allowedIds = value => [...new Set(value.split(/[\s,]+/).filter(id => /^[1-9]\d{0,15}$/.test(id)))];

function namesForIds(ids, names) {
  const result = {};
  for (const id of ids) {
    const name = names && typeof names[id] === "string" ? names[id].trim() : "";
    if (name) result[id] = name;
  }
  return result;
}

function configFromResponse(data) {
  const allowedUserIds = data.allowedUserIds || "";
  return {
    enabled: Boolean(data.enabled), tokenConfigured: Boolean(data.tokenConfigured), allowedUserIds,
    allowedUserNames: namesForIds(allowedIds(allowedUserIds), data.allowedUserNames),
    auditEnabled: Boolean(data.auditEnabled), auditChatId: data.auditChatId || ""
  };
}

export default function TelegramSettings() {
  const { t } = useI18n();
  const [config, setConfig] = React.useState(() => configFromResponse({}));
  const [token, setToken] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [botStatus, setBotStatus] = React.useState({ status: "unknown", error: "" });

  React.useEffect(() => {
    let mounted = true;
    fetch("/settings/telegram/config", { credentials: "same-origin" })
      .then(response => {
        if (!response.ok) throw new Error("Telegram configuration unavailable");
        return response.json();
      })
      .then(data => {
        if (mounted) {
          setConfig(configFromResponse(data));
          setLoaded(true);
        }
      })
      .catch(() => { if (mounted) setLoadError(true); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    let inFlight = false;
    let controller = null;
    const refreshStatus = async () => {
      if (inFlight) return;
      inFlight = true;
      controller = new AbortController();
      const deadline = setTimeout(() => controller && controller.abort(), 8000);
      try {
        const response = await fetch("/settings/telegram/status", { credentials: "same-origin", signal: controller.signal });
        if (!response.ok) throw new Error("Status unavailable");
        const data = await response.json();
        const allowed = ["disabled", "connecting", "connected", "error"];
        if (mounted) setBotStatus({ status: allowed.includes(data.state) ? data.state : "unknown", error: typeof data.error === "string" ? data.error : "" });
      } catch {
        if (mounted) setBotStatus({ status: "unknown", error: "" });
      } finally {
        clearTimeout(deadline);
        controller = null;
        inFlight = false;
      }
    };
    refreshStatus();
    const timer = setInterval(refreshStatus, 10000);
    return () => { mounted = false; clearInterval(timer); if (controller) controller.abort(); };
  }, []);

  const update = (field, value) => {
    setSaved(false);
    setConfig(current => ({ ...current, [field]: value }));
  };

  const ids = allowedIds(config.allowedUserIds);
  const updateName = (id, name) => {
    setSaved(false);
    setConfig(current => ({ ...current, allowedUserNames: { ...current.allowedUserNames, [id]: name } }));
  };

  const save = async event => {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    const payload = { enabled: config.enabled, allowedUserIds: config.allowedUserIds, allowedUserNames: namesForIds(ids, config.allowedUserNames), auditEnabled: config.auditEnabled, auditChatId: config.auditChatId };
    if (token.trim()) payload.token = token.trim();
    try {
      const response = await fetch("/settings/telegram/config", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error && result.error.message ? result.error.message : t("telegramSaveFailed"));
      }
      const result = await response.json();
      setConfig(configFromResponse(result));
      setToken("");
      setSaved(true);
    } catch (failure) {
      setError(failure.message || t("telegramSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return <Settings active="telegram">
    <div className="taisto-settings-page">
      <h1>{t("telegram")}</h1>
      <p className="taisto-settings-intro">{t("telegramIntro")}</p>
      <div className="alert alert-info" role="status"><strong>{t("telegramStatus")}: </strong>{t(`telegramStatus_${botStatus.status}`)}{botStatus.status === "error" && <span> — {t("telegramStatusErrorHint")}</span>}</div>
      <div className="alert alert-warning">{t("telegramSecurityHint")}</div>
      {loadError && <div className="alert alert-danger" role="alert">{t("telegramLoadFailed")}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {saved && <div className="alert alert-success" role="status">{t("telegramSaved")}</div>}
      {loading ? <div className="card"><div className="card-block">{t("telegramLoading")}</div></div> : loaded &&
        <section className="card">
          <div className="card-header"><strong>{t("telegramConfiguration")}</strong></div>
          <form className="card-block" onSubmit={save}>
            <div style={{ display: "grid", gap: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}><input type="checkbox" checked={config.enabled} onChange={event => update("enabled", event.target.checked)} /> <strong>{t("telegramEnable")}</strong></label>
              <div>
                <label htmlFor="telegram-token">{t("telegramToken")}</label>
                <input id="telegram-token" className="form-control" type="password" autoComplete="new-password" value={token} onChange={event => { setToken(event.target.value); setSaved(false); }} />
                <small className="form-text text-muted">{config.tokenConfigured ? t("telegramTokenConfigured") : t("telegramTokenMissing")}</small>
              </div>
              <div>
                <label htmlFor="telegram-allowed-users">{t("telegramAllowedUsers")}</label>
                <input id="telegram-allowed-users" className="form-control" inputMode="text" value={config.allowedUserIds} onChange={event => update("allowedUserIds", event.target.value)} placeholder="123456789, 987654321" />
                <small className="form-text text-muted">{t("telegramAllowedUsersHint")}</small>
              </div>
              {ids.length > 0 && <fieldset>
                <legend>{t("telegramDisplayNames")}</legend>
                <p className="form-text text-muted">{t("telegramDisplayNamesHint")}</p>
                {ids.map(id => <div key={id} className="form-group">
                  <label htmlFor={`telegram-name-${id}`}>Telegram ID: {id}</label>
                  <input id={`telegram-name-${id}`} className="form-control" type="text" maxLength={80} autoComplete="off"
                    placeholder={t("telegramDisplayNamePlaceholder")} value={config.allowedUserNames[id] || ""}
                    onChange={event => updateName(id, event.target.value)} />
                </div>)}
              </fieldset>}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "10px" }}><input type="checkbox" checked={config.auditEnabled} onChange={event => update("auditEnabled", event.target.checked)} /> <strong>{t("telegramAuditEnable")}</strong></label>
                <label htmlFor="telegram-audit-chat">{t("telegramAuditChat")}</label>
                <input id="telegram-audit-chat" className="form-control" inputMode="text" value={config.auditChatId} onChange={event => update("auditChatId", event.target.value)} placeholder="-1001234567890" />
                <small className="form-text text-muted">{t("telegramAuditHint")} {t("telegramAuditPrivacy")}</small>
              </div>
              <div><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? t("telegramSaving") : t("save")}</button></div>
            </div>
          </form>
        </section>}
    </div>
  </Settings>;
}
