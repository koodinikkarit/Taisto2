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

  return <nav className="navbar navbar-inverse fixed-top bg-inverse taisto-navigation">
    <div className="taisto-navigation-inner">
      <div className="taisto-navigation-top">
        <Link className="navbar-brand" to="/" onClick={closeMenu}>Taisto</Link>
        <button type="button" className="taisto-navigation-toggle" aria-label="Avaa navigointi" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /> <span /> <span />
        </button>
      </div>
      <div className={`taisto-navigation-menu ${open ? "is-open" : ""}`}>
        <ul className="navbar-nav mr-auto">
          <li className="nav-item"><Link className="nav-link" to="/" onClick={closeMenu}>{t("diagrams")}</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/output-groups" onClick={closeMenu}>{t("outputGroups")}</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/oletustilat" onClick={closeMenu}>{t("defaults")}</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/promode" onClick={closeMenu}>Promode</Link></li>
          {(!auth.required || auth.role === "admin") && <li className="nav-item"><Link className="nav-link" to="/settings" onClick={closeMenu}>{t("settings")}</Link></li>}
          <li className="nav-item"><Link className="nav-link" to="/apua" onClick={closeMenu}>{t("help")}</Link></li>
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
