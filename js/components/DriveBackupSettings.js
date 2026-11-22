import React from "react";
import Settings from "./Settings";
import { useI18n } from "../i18n";

const api = "/settings/drive-backup";
const failureKeys = new Map([
  ["Snapshot or encryption failed", "driveSnapshotFailed"],
  ["OAuth or encryption key file unavailable", "driveMissingFiles"],
  ["Drive upload or verification failed; check credentials and folder access", "driveUploadFailed"]
]);
const formatTime = (value, language) => {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime()) ? date.toLocaleString(language === "en" ? "en-GB" : "fi-FI") : "—";
};

async function request(path, options) {
  const response = await fetch(api + path, {
    credentials: "same-origin", cache: "no-store", redirect: "error",
    headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}) },
    ...options
  });
  if (!response.ok) throw Object.assign(new Error(), { status: response.status });
  return response;
}

export default function DriveBackupSettings() {
  const { language, t } = useI18n();
  const [status, setStatus] = React.useState(null);
  const [draft, setDraft] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [revision, refresh] = React.useReducer(n => n + 1, 0);
  const [loadError, setLoadError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const pending = React.useRef(false);
  const running = Boolean(status && status.running);

  React.useEffect(() => {
    if (busy) return;
    let active = true, timer;
    const controller = new AbortController();
    const poll = async () => {
      try {
        const response = await request("/config", { signal: controller.signal });
        const config = await response.json();
        if (active) { setStatus(config); setLoadError(""); }
      } catch (failure) {
        if (active) {
          const denied = failure.status === 401 || failure.status === 403;
          setLoadError(denied ? "driveAdminRequired" : "driveLoadError");
          if (denied) { setStatus(null); setDraft(null); }
        }
      } finally {
        if (active) timer = setTimeout(poll, running ? 2000 : 10000);
      }
    };
    poll();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [busy, revision, running]);

  const form = draft || status || { folderId: "", enabled: false };
  const folderId = form.folderId.trim();
  const dirty = Boolean(status && (folderId !== status.folderId || form.enabled !== status.enabled));
  const configured = Boolean(status && status.credentialsConfigured && status.keyConfigured);
  const update = fields => {
    setDraft({ folderId: form.folderId, enabled: form.enabled, ...fields });
    setError(""); setMessage("");
  };
  const submit = async action => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true); setMessage(""); setError("");
    try {
      if (action === "save") {
        await request("/config", { method: "PUT", body: JSON.stringify({ folderId, enabled: form.enabled }) });
        setDraft(null);
        setMessage("driveSaved");
      } else {
        await request("/run", { method: "POST", body: "{}" });
        setStatus(previous => previous && { ...previous, running: true });
        setMessage("driveAccepted");
      }
    } catch (failure) {
      if (failure.status === 401 || failure.status === 403) setError("driveAdminRequired");
      else if (failure.status === 409) setError("driveConflict");
      else setError(action === "save" ? "driveSaveError" : "driveRunError");
    } finally {
      pending.current = false; setBusy(false); refresh();
    }
  };

  return <Settings active="drive-backup">
    <div className="taisto-settings-page">
      <h1>{t("driveBackups")}</h1>
      <p className="taisto-settings-intro">{t("driveIntro")}</p>
      {(loadError || error) && <div className="alert alert-danger" role="alert">{t(error || loadError)}</div>}
      {message && <div className="alert alert-info" role="status">{t(message)}</div>}
      {!status && !loadError && <p role="status">{t("driveLoading")}</p>}
      {status && <>
        <section className="card mb-3">
          <div className="card-header"><strong>{t("driveSettings")}</strong></div>
          <form className="card-block" onSubmit={event => { event.preventDefault(); submit("save"); }}>
            <fieldset disabled={busy || running || Boolean(loadError)}>
              <div className="form-group">
                <label htmlFor="drive-folder">{t("driveFolder")}</label>
                <input id="drive-folder" className="form-control" type="text" value={form.folderId}
                  autoComplete="off" spellCheck={false} required={form.enabled} aria-describedby="drive-folder-hint"
                  onChange={event => update({ folderId: event.target.value })} />
                <small id="drive-folder-hint" className="form-text text-muted">{t("driveFolderHint")}</small>
              </div>
              <label><input type="checkbox" checked={form.enabled} onChange={event => update({ enabled: event.target.checked })} /> {t("driveSchedule")}</label>
              <div><button type="submit" className="btn btn-primary" disabled={!dirty || (form.enabled && (!configured || !folderId))}>{t("save")}</button></div>
            </fieldset>
          </form>
        </section>
        <section className="card">
          <div className="card-header"><strong>{t("driveStatus")}</strong></div>
          <div className="card-block">
            <dl>
              <dt>{t("driveOAuth")}</dt><dd>{t(status.credentialsConfigured ? "driveConfigured" : "driveMissing")}</dd>
              <dt>{t("driveKey")}</dt><dd>{t(status.keyConfigured ? "driveConfigured" : "driveMissing")}</dd>
              <dt>{t("driveLastAttempt")}</dt><dd>{formatTime(status.lastAttemptAt, language)}</dd>
              <dt>{t("driveLastSuccess")}</dt><dd>{formatTime(status.lastSuccessAt, language)}</dd>
              {status.lastFilename && <><dt>{t("driveLastFile")}</dt><dd>{status.lastFilename}</dd></>}
              {status.lastError && <><dt>{t("driveLastError")}</dt><dd>{t(failureKeys.get(status.lastError) || "driveUnknownFailure")}</dd></>}
            </dl>
            {!configured && <p className="alert alert-warning">{t("driveSetupHint")}</p>}
            {dirty && <p className="form-text text-muted">{t("driveSaveFirst")}</p>}
            <button type="button" className="btn btn-primary" disabled={busy || running || dirty || !status.folderId || !configured || Boolean(loadError)}
              onClick={() => submit("run")}>{t(running ? "driveRunning" : "driveRunNow")}</button>
          </div>
        </section>
      </>}
    </div>
  </Settings>;
}
