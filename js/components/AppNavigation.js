import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useI18n } from "../i18n";
import { useAuth } from "./ProtectedApp";

export default function AppNavigation() {
  const { language, setLanguage, t } = useI18n();
  const auth = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);
  const active = path => path === "/"
    ? location.pathname === "/" || location.pathname.startsWith("/diagram/")
    : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const navLink = (path, label) => <li className="nav-item"><Link className={`nav-link${active(path) ? " is-current" : ""}`} aria-current={active(path) ? "page" : undefined} to={path} onClick={closeMenu}>{label}</Link></li>;

  return <nav className="navbar navbar-inverse fixed-top bg-inverse taisto-navigation">
    <div className="taisto-navigation-inner">
      <div className="taisto-navigation-top">
        <Link className="navbar-brand taisto-brand" to="/" onClick={closeMenu}><img src="/static/taisto-logo-naytto-kytkenta.png" alt="Taisto" /></Link>
        <button type="button" className="taisto-navigation-toggle" aria-label={language === "en" ? (open ? "Close navigation" : "Open navigation") : (open ? "Sulje navigointi" : "Avaa navigointi")} aria-expanded={open} aria-controls="taisto-navigation-menu" onClick={() => setOpen(!open)}>
          <span aria-hidden="true" /> <span aria-hidden="true" /> <span aria-hidden="true" />
        </button>
      </div>
      <div id="taisto-navigation-menu" className={`taisto-navigation-menu ${open ? "is-open" : ""}`}>
        <ul className="navbar-nav mr-auto">
          {navLink("/", t("diagrams"))}
          {navLink("/output-groups", t("outputGroups"))}
          {navLink("/oletustilat", t("defaults"))}
          {navLink("/promode", "Promode")}
          {auth.authenticated && ["admin", "user"].includes(auth.role) && navLink("/projector", t("projector"))}
          {(!auth.required || auth.role === "admin") && navLink("/settings", t("settings"))}
          {navLink("/apua", t("help"))}
        </ul>
        <div className="taisto-navigation-actions">
          {auth.required && auth.authenticated && <span className="taisto-current-user">{auth.username} · {auth.role}</span>}
          {auth.required && auth.authenticated && <form method="post" action="/logout"><button type="submit" className="taisto-logout">{t("logout")}</button></form>}
          {auth.required && !auth.authenticated && <a className="taisto-login" href={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`}>{t("login")}</a>}
          <select aria-label="Language" className="form-control taisto-language" value={language} onChange={event => setLanguage(event.target.value)}><option value="fi">Suomi</option><option value="en">English</option></select>
        </div>
      </div>
    </div>
  </nav>;
}
