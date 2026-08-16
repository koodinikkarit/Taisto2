import React, { createContext, useContext, useEffect, useState } from "react";

const messages = {
  fi: {
    wait: "Odota…",
    outputListLabel: "Ryhmän outputit", selectedInputLabel: "Valittu input", currentActiveInputLabel: "Nyt aktiivinen input", mixedActiveInputs: "Outputeissa on eri inputit", unknownActiveInput: "Aktiivista inputia ei tunneta", activeForSelectedInput: "Kaikki outputit aktiivisia", inactiveForSelectedInput: "Ei aktiivinen valitulla inputilla", selectInputForStatus: "Valitse input nähdäksesi tilan",
    diagrams: "Kaaviot", defaults: "Oletustilat", settings: "Asetukset", help: "Apua", login: "Kirjaudu", logout: "Kirjaudu ulos", matrices: "Matriisit", timers: "Ajastimet", locks: "Lukot", translations: "Käännökset", connectMatrix: "Yhdistä uusi matriisi", remove: "Poista", save: "Tallenna", connected: "Yhdistetty", disconnected: "Katkaistu", invalidAddress: "Osoite on virheellinen", auditLog: "Audit-loki", auditIntro: "Muuttavat REST- ja GraphQL-pyynnöt sekä API-avainasetusten muutokset.", refresh: "Päivitä", refreshing: "Päivitetään…", time: "Aika", status: "Tila", action: "Toiminto", actor: "Tekijä", target: "Kohde", ipAddress: "IP-osoite", succeeded: "Onnistui", error: "Virhe", details: "Lisätiedot", noAuditEvents: "Audit-lokissa ei ole vielä tapahtumia.", auditRetention: "Näytetään 200 uusinta ympäristömuuttujan määrittämän säilytysajan sisällä olevaa tapahtumaa. Salaisuudet peitetään automaattisesti.", auditFetchError: "Audit-lokia ei voitu hakea.", auditRetentionLabel: "Säilytysaika", auditRetentionForever: "Ei automaattista poistoa", days: "päivää", eventCount: "tapahtumaa", users: "Käyttäjät", usersIntro: "Admin voi luoda käyttäjiä ja määrittää heidän käyttöoikeustasonsa.", environmentFallbackInfo: "Ympäristömuuttujan admin-tunnus on käytössä, koska tietokannassa ei ole admin-käyttäjää.", newUser: "Uusi käyttäjä", username: "Käyttäjätunnus", password: "Salasana", role: "Rooli", createUser: "Luo käyttäjä", existingUsers: "Käyttäjät", userCount: "Käyttäjiä", noDatabaseUsers: "Tietokannassa ei ole vielä käyttäjiä.", newPassword: "Uusi salasana", leaveBlankPassword: "Jätä tyhjäksi, jos salasana ei muutu", removeUserConfirm: "Poistetaanko käyttäjä", lastLogin: "Viimeisin kirjautuminen", loginCount: "Kirjautumisia", lastLoginIp: "Viimeisin IP-osoite", createdAt: "Luotu", updatedAt: "Muokattu", never: "Ei koskaan", lastAdminProtected: "Viimeinen admin tarvitaan, koska ympäristömuuttujan admin-tunnusta ei ole asetettu.",
    outputGroups: "Näyttöryhmät", outputGroupsIntro: "Suorita valmiiksi määritetty näyttöryhmä. Ryhmien muokkaus tehdään Asetuksissa.", selectInput: "Valitse input", execute: "Suorita", executing: "Suoritetaan…", on: "Päällä", off: "Ei päällä", output: "output", outputs: "outputia", input: "input", inputs: "inputia", noOutputGroups: "Näyttöryhmiä ei ole vielä määritetty.", executionFailed: "Näyttöryhmän suoritus epäonnistui.", apiKeys: "API-avaimet", outputGroupSettingsIntro: "Kokoa usein yhdessä vaihtuvat näytöt ryhmäksi. Ryhmän suoritus vaihtaa kaikki sen outputit samaan inputiin.", newOutputGroup: "Uusi näyttöryhmä", selectMatrixAndOutputs: "Valitse matriisi ja siihen kuuluvat outputit.", groupName: "Ryhmän nimi", groupNamePlaceholder: "Esim. Sali ja aula", matrix: "Matriisi", selected: "valittu", inputsInUse: "Käytettävät inputit", allInputs: "Kaikki inputit", allInputsHint: "Myös myöhemmin lisättävät inputit ovat käytettävissä.", selectedInputs: "Valitut inputit", selectedInputsHint: "Näytä käyttäjälle vain valitut inputit.", selectAtLeastOneOutput: "Valitse vähintään yksi output.", selectAtLeastOneInput: "Valitse vähintään yksi input.", createOutputGroup: "Luo näyttöryhmä", runOutputGroup: "Suorita näyttöryhmä", switchToInput: "Vaihda inputiin", allowedInputs: "Sallitut inputit", saveInputs: "Tallenna inputit", requestFailed: "Pyyntö epäonnistui.", selectInputForGroup: "Valitse ensin input ryhmälle.", removeOutputGroupConfirm: "Poistetaanko ryhmä", noOutputGroupsSettings: "Ei näyttöryhmiä vielä. Luo ensimmäinen ryhmä yllä.", auditSearch: "Haku", auditSearchPlaceholder: "Toiminto, käyttäjä, kohde tai IP", auditActionFilter: "Toiminto", auditResultFilter: "Lopputulos", auditActorTypeFilter: "Tekijän tyyppi", auditFrom: "Alkaen", auditTo: "Päättyen", all: "Kaikki", failed: "Epäonnistui", applyFilters: "Suodata", clearFilters: "Tyhjennä", auditActorUser: "Käyttäjä", auditActorApiKey: "API-avain", auditActorAnonymous: "Anonyymi", auditActorInvalidKey: "Virheellinen API-avain", auditActorUnauthenticated: "Tunnistamaton"
  },
  en: {
    wait: "Wait…",
    outputListLabel: "Group outputs", selectedInputLabel: "Selected input", currentActiveInputLabel: "Currently active input", mixedActiveInputs: "Outputs use different inputs", unknownActiveInput: "Active input is unknown", activeForSelectedInput: "All outputs active", inactiveForSelectedInput: "Not active on selected input", selectInputForStatus: "Select an input to see status",
    diagrams: "Diagrams", defaults: "Default states", settings: "Settings", help: "Help", login: "Sign in", logout: "Sign out", matrices: "Matrices", timers: "Timers", locks: "Locks", translations: "Translations", connectMatrix: "Connect a new matrix", remove: "Remove", save: "Save", connected: "Connected", disconnected: "Disconnected", invalidAddress: "Invalid address", auditLog: "Audit log", auditIntro: "Mutating REST and GraphQL requests and API key setting changes.", refresh: "Refresh", refreshing: "Refreshing…", time: "Time", status: "Status", action: "Action", actor: "Actor", target: "Target", ipAddress: "IP address", succeeded: "Succeeded", error: "Error", details: "Details", noAuditEvents: "The audit log does not contain any events yet.", auditRetention: "The newest 200 events within the retention period configured by the environment variable are shown. Secrets are redacted automatically.", auditFetchError: "The audit log could not be loaded.", auditRetentionLabel: "Retention", auditRetentionForever: "No automatic deletion", days: "days", eventCount: "events", users: "Users", usersIntro: "Admins can create users and assign their access level.", environmentFallbackInfo: "The environment admin credential is active because the database has no admin user.", newUser: "New user", username: "Username", password: "Password", role: "Role", createUser: "Create user", existingUsers: "Users", userCount: "User count", noDatabaseUsers: "No database users have been created yet.", newPassword: "New password", leaveBlankPassword: "Leave blank to keep the current password", removeUserConfirm: "Remove user", lastLogin: "Last sign-in", loginCount: "Sign-ins", lastLoginIp: "Last IP address", createdAt: "Created", updatedAt: "Updated", never: "Never", lastAdminProtected: "The final admin is required because no environment admin credential is configured.",
    outputGroups: "Output groups", outputGroupsIntro: "Run a configured output group. Groups can be edited in Settings.", selectInput: "Select input", execute: "Execute", executing: "Executing…", on: "On", off: "Not active", output: "output", outputs: "outputs", input: "input", inputs: "inputs", noOutputGroups: "No output groups have been configured.", executionFailed: "Output group execution failed.", apiKeys: "API keys", outputGroupSettingsIntro: "Group displays that are often switched together. Running a group switches all its outputs to the same input.", newOutputGroup: "New output group", selectMatrixAndOutputs: "Select a matrix and its outputs.", groupName: "Group name", groupNamePlaceholder: "For example, Hall and lobby", matrix: "Matrix", selected: "selected", inputsInUse: "Available inputs", allInputs: "All inputs", allInputsHint: "Inputs added later will also be available.", selectedInputs: "Selected inputs", selectedInputsHint: "Only show the selected inputs to users.", selectAtLeastOneOutput: "Select at least one output.", selectAtLeastOneInput: "Select at least one input.", createOutputGroup: "Create output group", runOutputGroup: "Run output group", switchToInput: "Switch to input", allowedInputs: "Allowed inputs", saveInputs: "Save inputs", requestFailed: "Request failed.", selectInputForGroup: "Select an input for the group first.", removeOutputGroupConfirm: "Remove group", noOutputGroupsSettings: "No output groups yet. Create the first group above.", auditSearch: "Search", auditSearchPlaceholder: "Action, user, target or IP", auditActionFilter: "Action", auditResultFilter: "Result", auditActorTypeFilter: "Actor type", auditFrom: "From", auditTo: "To", all: "All", failed: "Failed", applyFilters: "Apply filters", clearFilters: "Clear", auditActorUser: "User", auditActorApiKey: "API key", auditActorAnonymous: "Anonymous", auditActorInvalidKey: "Invalid API key", auditActorUnauthenticated: "Unauthenticated"
  }
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
