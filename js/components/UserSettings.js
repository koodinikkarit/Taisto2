import React from "react";
import Settings from "./Settings";
import { useI18n } from "../i18n";

const request = (url, options = {}) => fetch(url, Object.assign({ credentials: "same-origin" }, options)).then(async response => {
  if (response.ok) return response.status === 204 ? null : response.json();
  const body = await response.json().catch(() => ({}));
  throw new Error(body.error && body.error.message ? body.error.message : "Request failed");
});

export default function UserSettings() {
  const { language, t } = useI18n();
  const [users, setUsers] = React.useState([]);
  const [environmentAdminConfigured, setEnvironmentAdminConfigured] = React.useState(false);
  const [environmentFallbackActive, setEnvironmentFallbackActive] = React.useState(false);
  const [form, setForm] = React.useState({ username: "", password: "", role: "user" });
  const [passwords, setPasswords] = React.useState({});
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const formatTime = value => value ? new Intl.DateTimeFormat(language === "fi" ? "fi-FI" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : t("never");

  const load = React.useCallback(() => request("/settings/users/data").then(data => {
    setUsers(data.users || []);
    setEnvironmentAdminConfigured(Boolean(data.environmentAdminConfigured));
    setEnvironmentFallbackActive(Boolean(data.environmentFallbackActive));
    if (!(data.users || []).length) setForm(current => Object.assign({}, current, { role: "admin" }));
  }).catch(value => setError(value.message)), []);

  React.useEffect(() => { load(); }, [load]);

  const create = event => {
    event.preventDefault();
    setBusy(true);
    setError("");
    request("/settings/users/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    }).then(() => {
      setForm({ username: "", password: "", role: "user" });
      return load();
    }).catch(value => setError(value.message)).finally(() => setBusy(false));
  };

  const updateLocal = (id, field, value) => setUsers(current => current.map(user => user.id === id ? Object.assign({}, user, { [field]: value }) : user));
  const save = user => {
    setBusy(true);
    setError("");
    request(`/settings/users/data/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user.username, role: user.role, password: passwords[user.id] || "" })
    }).then(() => {
      setPasswords(current => Object.assign({}, current, { [user.id]: "" }));
      return load();
    }).catch(value => setError(value.message)).finally(() => setBusy(false));
  };
  const remove = user => {
    if (!window.confirm(`${t("removeUserConfirm")} ${user.username}?`)) return;
    setBusy(true);
    setError("");
    request(`/settings/users/data/${user.id}`, { method: "DELETE" })
      .then(load)
      .catch(value => setError(value.message))
      .finally(() => setBusy(false));
  };

  return <Settings active="users">
    <div className="taisto-settings-page">
      <h1>{t("users")}</h1>
      <p className="taisto-settings-intro">{t("usersIntro")}</p>
      {environmentFallbackActive && <div className="alert alert-info">{t("environmentFallbackInfo")}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <section className="card taisto-user-create">
        <div className="card-header"><strong>{t("newUser")}</strong></div>
        <form className="card-block taisto-user-form" onSubmit={create}>
          <label>{t("username")}<input className="form-control" minLength="3" maxLength="64" required value={form.username} onChange={event => setForm(Object.assign({}, form, { username: event.target.value }))} /></label>
          <label>{t("password")}<input className="form-control" type="password" minLength="8" required autoComplete="new-password" value={form.password} onChange={event => setForm(Object.assign({}, form, { password: event.target.value }))} /></label>
          <label>{t("role")}<select className="form-control" value={form.role} onChange={event => setForm(Object.assign({}, form, { role: event.target.value }))}><option value="user">user</option><option value="admin">admin</option></select></label>
          <button className="btn btn-success" type="submit" disabled={busy}>{t("createUser")}</button>
        </form>
      </section>

      <section className="taisto-user-list">
        <div className="taisto-user-list-heading"><div><h2>{t("existingUsers")}</h2><p>{t("userCount")}: {users.length}</p></div></div>
        {!users.length && <div className="alert alert-secondary">{t("noDatabaseUsers")}</div>}
        {users.map(user => {
          const lastAdminProtected = user.role === "admin" && users.filter(candidate => candidate.role === "admin").length === 1 && !environmentAdminConfigured;
          return <article className="card taisto-user-card" key={user.id}>
          <header className="taisto-user-card-header">
            <div className="taisto-user-identity"><span className="taisto-user-avatar">{(user.username || "?").slice(0, 1).toUpperCase()}</span><div><strong>{user.username}</strong><small>ID {user.id}</small></div></div>
            <span className={`taisto-role-badge is-${user.role}`}>{user.role}</span>
          </header>
          <div className="taisto-user-metadata">
            <div><span>{t("lastLogin")}</span><strong>{formatTime(user.lastLoginAt)}</strong></div>
            <div><span>{t("loginCount")}</span><strong>{Number(user.loginCount || 0)}</strong></div>
            <div><span>{t("lastLoginIp")}</span><strong>{user.lastLoginIp || "—"}</strong></div>
            <div><span>{t("createdAt")}</span><strong>{formatTime(user.createdAt)}</strong></div>
            <div><span>{t("updatedAt")}</span><strong>{formatTime(user.updatedAt)}</strong></div>
          </div>
          <div className="card-block taisto-user-edit">
            <label>{t("username")}<input className="form-control" value={user.username} onChange={event => updateLocal(user.id, "username", event.target.value)} /></label>
            <label>{t("role")}<select className="form-control" value={user.role} onChange={event => updateLocal(user.id, "role", event.target.value)}><option value="user" disabled={lastAdminProtected}>user</option><option value="admin">admin</option></select>{lastAdminProtected && <small>{t("lastAdminProtected")}</small>}</label>
            <label>{t("newPassword")}<input className="form-control" type="password" minLength="8" autoComplete="new-password" placeholder={t("leaveBlankPassword")} value={passwords[user.id] || ""} onChange={event => setPasswords(current => Object.assign({}, current, { [user.id]: event.target.value }))} /></label>
            <div className="taisto-user-buttons"><button type="button" className="btn btn-primary" disabled={busy} onClick={() => save(user)}>{t("save")}</button><button type="button" className="btn btn-outline-danger" disabled={busy || lastAdminProtected} title={lastAdminProtected ? t("lastAdminProtected") : ""} onClick={() => remove(user)}>{t("remove")}</button></div>
          </div>
        </article>;})}
      </section>
    </div>
  </Settings>;
}
