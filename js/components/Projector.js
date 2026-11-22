import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { useAuth } from "./ProtectedApp";
import Settings from "./Settings";

const inputs = [
  ["input1", "input_video", "Video"], ["input2", "input_a", "A"],
  ["input3", "input_b", "B"], ["input4", "input_c", "C"], ["input5", "input_d", "D"]
];
const isDenied = error => error.status === 401 || error.status === 403;

async function request(url, { body, ...options } = {}) {
  const response = await fetch(url, {
    credentials: "same-origin", cache: "no-store", redirect: "error",
    headers: { Accept: "application/json", ...(body && { "Content-Type": "application/json" }) },
    ...(body && { body: JSON.stringify(body) }), ...options
  });
  if (!response.ok) throw Object.assign(new Error(), { status: response.status });
  return response.json();
}

export function Projector() {
  const { t } = useI18n();
  const { role } = useAuth();
  const [device, setDevice] = useState(null);
  const [readError, setReadError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, refresh] = React.useReducer(value => value + 1, 0);
  const locked = useRef(false), mounted = useRef(false), unlock = useRef(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(unlock.current); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let timer;
    async function poll() {
      let interval = 2000;
      try {
        const data = await request("/projector/status", { signal: controller.signal });
        if (!controller.signal.aborted) { setDevice(data); setReadError(""); }
        if (!data.enabled) interval = 10000;
      } catch (error) {
        if (controller.signal.aborted) return;
        setDevice(null);
        setReadError(isDenied(error) ? "projectorLogin" : "projectorUnreachable");
        if (isDenied(error)) return;
        interval = 5000;
      }
      if (!controller.signal.aborted) timer = setTimeout(poll, interval);
    }
    poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [revision]);

  async function send(command, confirmation) {
    if (locked.current || !device?.enabled || (confirmation && !window.confirm(t(confirmation)))) return;
    locked.current = true; setBusy(true); setNotice("");
    try {
      await request("/projector/command", { method: "POST", body: { command } });
      if (mounted.current) setNotice("projectorSent");
    } catch (error) {
      if (mounted.current) setNotice(isDenied(error) ? "projectorLogin" :
        error.status === 429 ? "projectorWait" : "projectorCommandError");
    } finally {
      if (mounted.current) {
        refresh();
        unlock.current = setTimeout(() => { locked.current = false; setBusy(false); }, 2000);
      }
    }
  }
  const button = (command, label, confirm, disabled = false) =>
    <button type="button" className="btn btn-outline-secondary" disabled={busy || disabled} onClick={() => send(command, confirm)}>{t(label)}</button>;
  const inputName = ([id, , fallback]) => device?.labels?.[id] || (fallback === "Video" ? fallback : t("projectorInput") + " " + fallback);
  const activeInput = inputs.find(([id]) => device && id === device.currentInput);
  const power = device?.powerOn;
  const showToggle = power === true ? !device?.canPowerOff : power === false ? !device?.canPowerOn : (!device?.canPowerOn || !device?.canPowerOff);
  const settingsLink = role === "admin" && <Link to="/settings/projector">{t("projectorSettings")}</Link>;
  return <main className="taisto-runner-page">
    <header className="jumbotron taisto-runner-hero"><h1>{t("projector")}</h1><p>{t("projectorIntro")}</p></header>
    {readError && <div className="alert alert-warning" role="alert">{t(readError)} {settingsLink}</div>}
    {!device && !readError && <p role="status">{t("projectorLoading")}</p>}
    {device && !device.enabled && <div className="alert alert-info" role="status">{t("projectorDisabled")} {settingsLink}</div>}
    {device?.enabled && <section className="taisto-runner-card">
      <div className="taisto-runner-card-header"><h2>{t("projectorPower")}</h2>
        <span className={"taisto-runner-status " + (power === true ? "is-on" : power === false ? "is-off" : "is-idle")}>
          {t(power === true ? "projectorOn" : power === false ? "projectorOff" : "projectorUnknown")}
        </span>
      </div>
      <div className="taisto-projector-actions">
        {device.canPowerOn && button("power_on", "projectorTurnOn", "projectorConfirmOn", power === true)}
        {device.canPowerOff && button("power_off", "projectorTurnOff", "projectorConfirmOff", power === false)}
        {showToggle && button("power_toggle", "projectorToggle", "projectorConfirmToggle")}
      </div>
      <div className="taisto-runner-active-input"><span>{t("currentActiveInputLabel")}</span><strong>{activeInput ? inputName(activeInput) : device.currentInput || t("projectorUnknown")}</strong></div>
      <div className="taisto-projector-actions" role="group" aria-label={t("projectorInput")}>
        {inputs.map(input => <button type="button" key={input[0]} aria-pressed={device.currentInput === input[0]}
          className={"btn " + (device.currentInput === input[0] ? "btn-primary" : "btn-outline-secondary")}
          disabled={busy || device.currentInput === input[0]} onClick={() => send(input[1])}>{inputName(input)}</button>)}
      </div>
      <h2>{t("projectorPicture")}</h2>
      <div className="taisto-projector-actions">
        {button("freeze", "projectorFreeze")}{button("picture_blank", "projectorBlank")}
      </div>
    </section>}
    {notice && <p className={"alert mt-3 " + (notice === "projectorSent" ? "alert-info" : "alert-warning")} role="status">{t(notice)}</p>}
  </main>;
}

export function ProjectorSettings() {
  const { t } = useI18n();
  const [config, setConfig] = useState(null);
  const [saved, setSaved] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    request("/settings/projector/config", { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) { setConfig(data); setSaved(data); }
    }).catch(error => {
      if (!controller.signal.aborted) setMessage(isDenied(error) ? "projectorLogin" : "projectorLoadError");
    });
    return () => controller.abort();
  }, []);
  async function save(event) {
    event.preventDefault();
    if (!config || pending.current) return;
    pending.current = true; setBusy(true); setMessage("");
    try {
      const data = await request("/settings/projector/config", { method: "PUT", body: { ...config, port: Number(config.port) } });
      setConfig(data); setSaved(data); setMessage("projectorSaved");
    } catch (error) {
      setMessage(isDenied(error) ? "projectorLogin" : error.status === 400 ? "projectorInvalid" : "projectorSaveError");
    } finally { pending.current = false; setBusy(false); }
  }
  const update = (key, value) => { setConfig(prev => ({ ...prev, [key]: value })); setMessage(""); };
  const field = (key, label, attrs = {}) => <label>{t(label)}
    <input className="form-control" name={key} value={config[key] ?? ""} onChange={e => update(key, e.target.value)} autoComplete="off" spellCheck={false} {...attrs} />
  </label>;
  return <Settings active="projector"><div className="taisto-settings-page">
    <h1>{t("projectorSettings")}</h1><p className="taisto-settings-intro">{t("projectorConfigIntro")}</p>
    {message && <div role="status" className={"alert " + (message === "projectorSaved" ? "alert-info" : "alert-warning")}>{t(message)}</div>}
    {!config && !message && <p role="status">{t("projectorLoading")}</p>}
    {config && <form className="card card-block" onSubmit={save}>
      <fieldset disabled={busy}>
        <label><input type="checkbox" checked={config.enabled} onChange={e => update("enabled", e.target.checked)} /> {t("projectorEnable")}</label>
        <div className="taisto-projector-fields">
          {field("host", "projectorHost", { required: config.enabled, maxLength: 253, placeholder: "192.0.2.10" })}
          {field("port", "projectorPort", { type: "number", required: true, min: 1, max: 65535 })}
          {field("path", "projectorPath", { required: true, maxLength: 256, placeholder: "/cgi-bin/web.cgi" })}
        </div>
        <details><summary>{t("projectorDiscrete")}</summary>
          <p>{t("projectorDiscreteHelp")}</p>
          <div className="taisto-projector-codes">{[
            ["projectorToggle", "powerCategory", "powerToggleCode"],
            ["projectorTurnOn", "powerOnCategory", "powerOnCode"],
            ["projectorTurnOff", "powerOffCategory", "powerOffCode"]
          ].map(([title, category, code]) => <fieldset key={code}>
            <legend>{t(title)}</legend>
            {field(category, "projectorCategory", { required: category === "powerCategory", maxLength: 4, pattern: "[0-9a-fA-F]{4}", placeholder: config.powerCategory || "4054" })}
            {field(code, "projectorCode", { required: code === "powerToggleCode", maxLength: 2, pattern: "[0-9a-fA-F]{2}" })}
          </fieldset>)}</div>
        </details>
        <div className="taisto-projector-actions"><button type="submit" className="btn btn-primary" disabled={config === saved}>{t("save")}</button>
          <Link to="/projector">{t("projectorOpen")}</Link>
        </div>
      </fieldset>
    </form>}
  </div></Settings>;
}
