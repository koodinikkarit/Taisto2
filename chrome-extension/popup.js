"use strict";

const $ = id => document.getElementById(id);
const settings = $("settings");
const controls = $("controls");
const notice = $("notice");
const diagramSelect = $("diagram");
const screens = $("screens");
const connection = $("connection-state");
const liveStatuses = new Map();
let baseUrl = "";
let apiKey = "";
let diagrams = [];
let generation = 0;
const pendingPorts = new Set();
let refreshInFlight = false;

function showNotice(message, error = false) {
  notice.textContent = message;
  notice.className = `notice${error ? " error" : ""}`;
  notice.hidden = !message;
}

function setConnection(message, offline = false) {
  connection.textContent = message;
  connection.classList.toggle("offline", offline);
}

function settingsOpen(open) {
  settings.hidden = !open;
  $("settings-toggle").setAttribute("aria-expanded", String(open));
}

function updateBusyControls() {
  const busy = pendingPorts.size > 0;
  $("refresh").disabled = busy;
  $("settings-toggle").disabled = busy;
  diagramSelect.disabled = busy || !diagrams.length;
  settings.querySelectorAll("input, button").forEach(element => { element.disabled = busy; });
}

function normalizeServer(raw) {
  let url;
  try { url = new URL(raw.trim()); } catch (_) { throw new Error("Anna kelvollinen Taiston osoite, esimerkiksi http://192.168.1.10:1337."); }
  if (!(["http:", "https:"].includes(url.protocol)) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Käytä HTTP- tai HTTPS-osoitetta ilman polkua, käyttäjätunnusta tai lisäparametreja.");
  }
  return url.origin;
}

function hostPattern(origin) {
  const url = new URL(origin);
  // Chrome host-permission patterns do not include the port.
  return `${url.protocol}//${url.hostname}/*`;
}

async function apiRequest(origin, resource, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(`${origin}${resource}`, {
      ...options,
      signal: controller.signal,
      credentials: "omit",
      cache: "no-store",
      redirect: "error"
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error("API-avain on virheellinen, vanhentunut tai pois käytöstä.");
      if (response.status === 503) throw new Error("Taistoon ei ole määritetty API-avainta eikä anonyymi kirjoitus ole käytössä.");
      throw new Error(`Taisto palautti virheen ${response.status}.`);
    }
    return await response.json();
  } finally { clearTimeout(timeout); }
}

function messageForError(error) {
  if (error && error.name === "AbortError") return "Yhteys aikakatkaistiin. Tarkista palvelin ja verkko.";
  if (error && error.name === "SyntaxError") return "Osoitteessa ei vastaa Taiston rajapinta.";
  if (error instanceof TypeError) return "Yhteyttä Taistoon ei saatu. Tarkista osoite, verkkoyhteys ja Chromen verkkoluvat.";
  return (error && error.message) || "Yhteys Taistoon epäonnistui.";
}

function addElement(parent, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  parent.appendChild(element);
  return element;
}

function portLabel(port, fallback) {
  if (!port) return fallback;
  const name = port.slug || fallback;
  return port.portNum === null || port.portNum === undefined ? name : `${port.portNum}. ${name}`;
}

function updateCurrent(element, data) {
  if (data.status === "connected" && data.cpuPort) {
    element.textContent = portLabel(data.cpuPort, "Nimetön input");
  } else if (data.status === "disconnected") {
    element.textContent = "Ei kytkentää";
  } else {
    element.textContent = "Ei tiedossa";
  }
}

async function updateScreen(origin, conPortId, current) {
  const status = await apiRequest(origin, `/rest/con-ports/${encodeURIComponent(conPortId)}/video-connection`);
  if (current.isConnected) updateCurrent(current, status);
  return status;
}

function createScreen(screen, origin, currentGeneration) {
  const originKey = apiKey;
  const card = addElement(screens, "article", "screen");
  const con = screen.conPort;
  addElement(card, "h2", "", portLabel(con, screen.slug || "Näyttö"));
  const currentLine = addElement(card, "div", "current");
  addElement(currentLine, "span", "", "Viimeksi tunnettu lähde: ");
  const current = addElement(currentLine, "strong", "", "Haetaan…");

  if (!con || !con.id) {
    current.textContent = "Näyttöön ei ole määritetty outputia";
    return;
  }
  const id = String(con.id);
  if (!liveStatuses.has(id)) liveStatuses.set(id, []);
  liveStatuses.get(id).push(current);
  const selectId = `input-${screen.id}`;
  const label = addElement(card, "label", "", "Valitse uusi lähde");
  label.htmlFor = selectId;
  const select = addElement(card, "select");
  select.id = selectId;
  const blank = addElement(select, "option", "", "Valitse input");
  blank.value = "";
  const options = Array.isArray(screen.cpuPorts) ? screen.cpuPorts.filter(port => port && port.id != null) : [];
  for (const port of options) {
    const option = addElement(select, "option", "", portLabel(port, "Nimetön input"));
    option.value = String(port.id);
  }
  const button = addElement(card, "button", "button primary", "Vaihda lähde");
  button.type = "button";
  button.disabled = !options.length || pendingPorts.has(id);
  const statusText = addElement(card, "div", "screen-status", options.length ? "" : "Kaavioon ei ole valittu lähteitä.");
  statusText.setAttribute("role", "status");
  statusText.setAttribute("aria-live", "polite");

  button.addEventListener("click", async () => {
    if (origin !== baseUrl || generation !== currentGeneration || !card.isConnected) return;
    const inputId = select.value;
    if (!options.some(port => String(port.id) === inputId)) {
      statusText.textContent = "Valitse ensin lähde.";
      statusText.className = "screen-status error";
      return;
    }
    if (pendingPorts.has(id)) return;
    pendingPorts.add(id);
    updateBusyControls();
    button.disabled = true;
    select.disabled = true;
    statusText.className = "screen-status";
    statusText.textContent = "Lähetetään vaihtoa…";
    let commandSent = false;
    try {
      const headers = { "Content-Type": "application/json" };
      if (originKey) headers["X-API-Key"] = originKey;
      await apiRequest(origin, `/rest/con-ports/${encodeURIComponent(id)}/video-connection`, {
        method: "POST", headers, body: JSON.stringify({ cpuPort: inputId })
      });
      commandSent = true;
      if (generation !== currentGeneration || !card.isConnected) return;
      statusText.textContent = "Komento lähetetty. Odotetaan tilavahvistusta…";
      const deadline = Date.now() + 15000;
      let confirmed = false;
      while (Date.now() < deadline && generation === currentGeneration && card.isConnected) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const result = await updateScreen(origin, id, current);
        if (result.status === "connected" && result.cpuPort && String(result.cpuPort.id) === inputId) { confirmed = true; break; }
      }
      if (generation !== currentGeneration || !card.isConnected) return;
      statusText.className = confirmed ? "screen-status success" : "screen-status error";
      statusText.textContent = confirmed ? "Viimeksi tunnettu tila vastaa valintaa; laitteen kuittausta ei voi varmistaa." : "Vahvistusta ei saatu. Tarkista matriisin yhteys ja päivitä tila.";
    } catch (error) {
      if (generation === currentGeneration && card.isConnected) {
        statusText.className = "screen-status error";
        statusText.textContent = commandSent ? `Komento lähetettiin, mutta tilaa ei saatu: ${messageForError(error)}` : messageForError(error);
        if (commandSent) setConnection("Yhteys tai tilan haku epäonnistui", true);
      }
    } finally {
      pendingPorts.delete(id);
      updateBusyControls();
      if (card.isConnected) { button.disabled = !options.length; select.disabled = false; }
    }
  });

  updateScreen(origin, id, current).catch(() => {
    if (current.isConnected) {
      current.textContent = "Tilan haku epäonnistui";
      setConnection("Yhteys tai tilan haku epäonnistui", true);
    }
  });
}

function renderScreens() {
  generation++;
  const currentGeneration = generation;
  screens.replaceChildren();
  liveStatuses.clear();
  const diagram = diagrams.find(item => String(item.id) === diagramSelect.value);
  if (!diagram) return;
  const items = Array.isArray(diagram.diagramScreens) ? diagram.diagramScreens : [];
  if (!items.length) addElement(screens, "div", "empty", "Kaaviossa ei ole näyttöjä.");
  for (const screen of items) if (screen) createScreen(screen, baseUrl, currentGeneration);
}

async function loadDiagrams() {
  const currentGeneration = ++generation;
  const origin = baseUrl;
  if (!origin) { settingsOpen(true); showNotice("Määritä Taiston osoite aloittaaksesi."); return; }
  setConnection("Yhdistetään…");
  showNotice("");
  try {
    const data = await apiRequest(origin, "/rest/diagrams");
    if (generation !== currentGeneration || origin !== baseUrl) return;
    if (!Array.isArray(data)) throw new Error("Taisto palautti virheellisen kaaviolistan.");
    diagrams = data.filter(item => item && item.id != null);
    const saved = await chrome.storage.local.get("lastDiagramId");
    if (generation !== currentGeneration || origin !== baseUrl) return;
    const previous = diagramSelect.value || String(saved.lastDiagramId || "");
    diagramSelect.replaceChildren();
    for (const diagram of diagrams) {
      const option = addElement(diagramSelect, "option", "", diagram.slug || "Nimetön kaavio");
      option.value = String(diagram.id);
    }
    if (diagrams.some(item => String(item.id) === previous)) diagramSelect.value = previous;
    controls.hidden = false;
    $("open-taisto").href = origin + "/";
    setConnection("● Taisto tavoitettu");
    if (!diagrams.length) {
      screens.replaceChildren();
      addElement(screens, "div", "empty", "Taistossa ei ole kaavioita.");
      diagramSelect.disabled = true;
    } else {
      diagramSelect.disabled = false;
      renderScreens();
    }
  } catch (error) {
    if (generation !== currentGeneration || origin !== baseUrl) return;
    controls.hidden = true;
    setConnection("Ei yhteyttä", true);
    showNotice(messageForError(error), true);
    settingsOpen(true);
  }
}

$("settings-toggle").addEventListener("click", () => settingsOpen(settings.hidden));
$("cancel-settings").addEventListener("click", () => settingsOpen(false));
$("refresh").addEventListener("click", () => loadDiagrams());
$("server-url").addEventListener("input", () => {
  // Never silently reuse a previously entered secret for a different server.
  if (apiKey && $("api-key").value === apiKey) $("api-key").value = "";
});
diagramSelect.addEventListener("change", () => {
  chrome.storage.local.set({ lastDiagramId: diagramSelect.value });
  renderScreens();
});

settings.addEventListener("submit", async event => {
  event.preventDefault();
  let origin;
  try { origin = normalizeServer($("server-url").value); }
  catch (error) { showNotice(error.message, true); return; }
  const key = $("api-key").value.trim();
  try {
    // Request is called directly from the user's submit gesture.
    const permission = chrome.permissions.request({ origins: [hostPattern(origin)] });
    // Retire the old controls immediately, before permission or storage awaits.
    generation++;
    controls.hidden = true;
    screens.replaceChildren();
    liveStatuses.clear();
    const granted = await permission;
    if (!granted) {
      if (baseUrl) await loadDiagrams();
      showNotice("Taiston osoitteen verkkolupa tarvitaan yhteyttä varten.", true);
      settingsOpen(true);
      return;
    }
    await chrome.storage.local.set({ serverUrl: origin, lastDiagramId: "" });
    if (key) await chrome.storage.session.set({ taistoAuth: { origin, key } });
    else await chrome.storage.session.remove("taistoAuth");
    generation++;
    baseUrl = origin;
    apiKey = key;
    $("server-url").value = origin;
    settingsOpen(false);
    await loadDiagrams();
  } catch (error) { showNotice(messageForError(error), true); }
});

async function initialize() {
  try {
    const [local, session] = await Promise.all([chrome.storage.local.get(["serverUrl"]), chrome.storage.session.get("taistoAuth")]);
    if (local.serverUrl) baseUrl = normalizeServer(local.serverUrl);
    if (session.taistoAuth && session.taistoAuth.origin === baseUrl && typeof session.taistoAuth.key === "string") apiKey = session.taistoAuth.key;
    $("server-url").value = baseUrl;
    $("api-key").value = apiKey;
    await loadDiagrams();
  } catch (error) { settingsOpen(true); showNotice(messageForError(error), true); }
}

initialize();

setInterval(async () => {
  if (!baseUrl || controls.hidden || !settings.hidden || refreshInFlight) return;
  const origin = baseUrl;
  const currentGeneration = generation;
  refreshInFlight = true;
  try {
    const results = await Promise.all(Array.from(liveStatuses, async ([id, elements]) => {
      if (pendingPorts.has(id)) return null;
      try {
        const status = await apiRequest(origin, `/rest/con-ports/${encodeURIComponent(id)}/video-connection`);
        if (generation === currentGeneration && origin === baseUrl) {
          for (const element of elements) if (element.isConnected) updateCurrent(element, status);
        }
        return true;
      } catch (_) {
        if (generation === currentGeneration && origin === baseUrl) {
          for (const element of elements) if (element.isConnected) element.textContent = "Tilan haku epäonnistui";
        }
        return false;
      }
    }));
    if (generation === currentGeneration && origin === baseUrl) {
      if (results.includes(false)) setConnection("Yhteys tai tilan haku epäonnistui", true);
      else if (results.includes(true)) setConnection("● Taisto tavoitettu");
    }
  } finally { refreshInFlight = false; }
}, 5000);
