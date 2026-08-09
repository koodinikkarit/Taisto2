import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";

export default function AppNavigation() {
  const { language, setLanguage, t } = useI18n();
  return <nav className="navbar navbar-toggleable-md navbar-inverse fixed-top bg-inverse">
    <Link className="navbar-brand" to="/">Taisto</Link>
    <div className="collapse navbar-collapse" id="taistoNavBar"><ul className="navbar-nav mr-auto">
      <li className="nav-item"><Link className="nav-link" to="/">{t("diagrams")}</Link></li>
      <li className="nav-item"><Link className="nav-link" to="/oletustilat">{t("defaults")}</Link></li>
      <li className="nav-item"><Link className="nav-link" to="/promode">Promode</Link></li>
      <li className="nav-item"><Link className="nav-link" to="/settings">{t("settings")}</Link></li>
      <li className="nav-item"><a className="nav-link" href="#">{t("help")}</a></li>
    </ul><span className="navbar-text mr-2">{t("login")}</span>
      <select aria-label="Language" className="form-control" value={language} onChange={event => setLanguage(event.target.value)}><option value="fi">Suomi</option><option value="en">English</option></select>
    </div>
  </nav>;
}
