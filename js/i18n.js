import React, { createContext, useContext, useEffect, useState } from "react";

const messages = {
  fi: { diagrams: "Kaaviot", defaults: "Oletustilat", settings: "Asetukset", help: "Apua", login: "Kirjaudu", matrices: "Matriisit", timers: "Ajastimet", locks: "Lukot", translations: "Käännökset", connectMatrix: "Yhdistä uusi matriisi", remove: "Poista", connected: "Yhdistetty", disconnected: "Katkaistu", invalidAddress: "Osoite on virheellinen" },
  en: { diagrams: "Diagrams", defaults: "Default states", settings: "Settings", help: "Help", login: "Sign in", matrices: "Matrices", timers: "Timers", locks: "Locks", translations: "Translations", connectMatrix: "Connect a new matrix", remove: "Remove", connected: "Connected", disconnected: "Disconnected", invalidAddress: "Invalid address" }
};

const uiTranslations = {
  "Tunniste": "Identifier", "Matriisi": "Matrix", "Näyttölaite": "Display device", "Näyttö": "Display", "Laitteet": "Devices", "Nimi": "Name",
  "Lisää": "Add", "Lisää laite": "Add device", "Lisää näyttö": "Add display", "Lisää Suoritettavat komento": "Add command", "Luo uusi kaavio.": "Create a new diagram", "Luo uusi ajastin": "Create a new timer",
  "Peruuta": "Cancel", "Tallenna": "Save", "Päivitä": "Refresh", "Poista": "Remove", "Yhdistä": "Connect", "Yhdistä uusi matriisi": "Connect a new matrix",
  "Con porttien määrä": "Number of Con ports", "Cpu porttien määrä": "Number of CPU ports", "Con port": "Con port", "Cpu port": "CPU port", "Con ports": "Con ports", "Cpu ports": "CPU ports", "Portit": "Ports", "Yhteys": "Connection",
  "Kaaviot": "Diagrams", "Kaaviolista": "Diagram list", "Kaavion näytöt": "Diagram displays", "Oletustilat": "Default states", "Matriisit": "Matrices", "Ajastimet": "Timers", "Viikkoajastin": "Weekly timer", "Viikottaiset ajastimet.": "Weekly timers.",
  "Suoritettavat komennot": "Commands to run", "Kommennon tyyppi": "Command type", "Valitse matriisi": "Select matrix", "Valitse oletustila": "Select default state", "Videoyhteys": "Video connection", "Kwmyhteys": "KVM connection", "Näppäimistöyhteydet": "Keyboard connections", "Näppäimistö:": "Keyboard:",
  "Maanantai": "Monday", "Tiistai": "Tuesday", "Keskiviikko": "Wednesday", "Torstai": "Thursday", "Perjantai": "Friday", "Lauantai": "Saturday", "Sunnuntai": "Sunday",
  "Osoite on virheellinen": "Invalid address", "Yhdistetty": "Connected", "Katkaistu": "Disconnected", "Virheelliset parametrit": "Invalid parameters", "Et ole vielä yhdistänyt yhtäkään matriisia.": "You have not connected any matrices yet.",
  "Ei olee": "Nothing found", "ei oo": "Nothing found", "Ei mittaa": "No measurement", "DefaultStates": "Default states", "LockList": "Locks", "TranslationList": "Translations", "Hei": "Hello", "hoii": "Hello"
};

function translatedText(text, language) {
  const source = language === "en" ? uiTranslations : Object.fromEntries(Object.entries(uiTranslations).map(([fi, en]) => [en, fi]));
  const leading = text.match(/^\s*/)[0];
  const trailing = text.match(/\s*$/)[0];
  const value = text.trim();
  if (source[value]) return `${leading}${source[value]}${trailing}`;
  const prefixes = language === "en" ? { "Matriisi:": "Matrix:", "Näyttö:": "Display:" } : { "Matrix:": "Matriisi:", "Display:": "Näyttö:" };
  const prefix = Object.keys(prefixes).find(key => value.startsWith(key));
  return prefix ? `${leading}${prefixes[prefix]}${value.slice(prefix.length)}${trailing}` : text;
}

function translatePage(language) {
  const root = document.getElementById("root");
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => { node.nodeValue = translatedText(node.nodeValue, language); });
}

const I18nContext = createContext({ language: "fi", setLanguage: () => {}, t: key => key });

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("taisto-language") || "fi");
  useEffect(() => {
    localStorage.setItem("taisto-language", language);
    document.documentElement.lang = language;
    translatePage(language);
    const observer = new MutationObserver(() => translatePage(language));
    observer.observe(document.getElementById("root"), { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  return <I18nContext.Provider value={{ language, setLanguage, t: key => messages[language][key] || key }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
export { I18nContext };
