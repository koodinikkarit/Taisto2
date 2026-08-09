import React, { createContext, useContext, useEffect, useState } from "react";

const messages = {
  fi: { diagrams: "Kaaviot", defaults: "Oletustilat", settings: "Asetukset", help: "Apua", login: "Kirjaudu", matrices: "Matriisit", timers: "Ajastimet", locks: "Lukot", translations: "Käännökset", connectMatrix: "Yhdistä uusi matriisi", remove: "Poista", connected: "Yhdistetty", disconnected: "Katkaistu", invalidAddress: "Osoite on virheellinen" },
  en: { diagrams: "Diagrams", defaults: "Default states", settings: "Settings", help: "Help", login: "Sign in", matrices: "Matrices", timers: "Timers", locks: "Locks", translations: "Translations", connectMatrix: "Connect a new matrix", remove: "Remove", connected: "Connected", disconnected: "Disconnected", invalidAddress: "Invalid address" }
};

const I18nContext = createContext({ language: "fi", setLanguage: () => {}, t: key => key });

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("taisto-language") || "fi");
  useEffect(() => { localStorage.setItem("taisto-language", language); document.documentElement.lang = language; }, [language]);
  return <I18nContext.Provider value={{ language, setLanguage, t: key => messages[language][key] || key }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
export { I18nContext };
