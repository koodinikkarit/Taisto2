const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

class Element {
  constructor(tag = "div") {
    this.tagName = tag.toLowerCase();
    this.children = [];
    this.handlers = {};
    this.value = "";
    this.textContent = "";
    this.hidden = false;
    this.disabled = false;
    this.isConnected = true;
    this.classList = { toggle() {} };
  }
  appendChild(child) {
    this.children.push(child);
    child.isConnected = this.isConnected;
    return child;
  }
  replaceChildren(...children) {
    const disconnect = item => { item.isConnected = false; item.children.forEach(disconnect); };
    this.children.forEach(disconnect);
    this.children = [];
    this.value = "";
    children.forEach(child => this.appendChild(child));
  }
  addEventListener(type, callback) { this.handlers[type] = callback; }
  setAttribute() {}
  querySelectorAll() { return []; }
  dispatch(type) { return this.handlers[type]({ preventDefault() {} }); }
}

const ids = ["settings", "controls", "notice", "diagram", "screens", "connection-state", "settings-toggle", "cancel-settings", "refresh", "server-url", "api-key", "open-taisto"];
const nodes = Object.fromEntries(ids.map(id => [id, new Element(id === "diagram" ? "select" : "div")]));
nodes.settings.hidden = true;
nodes.controls.hidden = true;
const document = { getElementById: id => nodes[id], createElement: tag => new Element(tag) };

function area(initial) {
  const data = { ...initial };
  return {
    async get(keys) {
      const names = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(names.map(key => [key, data[key]]));
    },
    async set(values) { Object.assign(data, values); },
    async remove(key) { delete data[key]; }
  };
}

const calls = [];
let grant;
let permissionOrigins;
const chrome = {
  storage: {
    local: area({ serverUrl: "http://a.test:1337", lastDiagramId: "room" }),
    session: area({ taistoAuth: { origin: "http://a.test:1337", key: "old-secret" } })
  },
  permissions: { request: ({ origins }) => { permissionOrigins = origins; return new Promise(resolve => { grant = resolve; }); } }
};

let statusReads = 0;
let statusMode = "normal";
let intervalCallback;
let fakeTime = 0;
const fetchMock = async (url, options = {}) => {
  calls.push({ url, options });
  if (url.startsWith("http://bad.test") && url.endsWith("/rest/diagrams")) return { ok: true, async json() { throw new SyntaxError("server response contains sensitive raw data"); } };
  if (url.endsWith("/rest/diagrams")) return { ok: true, async json() { return [{ id: "room", slug: "Sali", diagramScreens: [{ id: "screen", slug: "Näyttö", conPort: { id: "35", portNum: 1, slug: "Tykki" }, cpuPorts: [{ id: "37", portNum: 2, slug: "Kamera" }] }] }]; } };
  if (url.endsWith("/rest/con-ports/35/video-connection") && options.method === "POST") return { ok: true, async json() { return {}; } };
  if (url.endsWith("/rest/con-ports/35/video-connection")) {
    if (statusMode === "failure") throw new TypeError("network error");
    statusReads++;
    if (statusMode === "unknown") return { ok: true, async json() { return { status: "unknown", cpuPort: null }; } };
    return { ok: true, async json() { return statusReads > 1 ? { status: "connected", cpuPort: { id: "37", portNum: 2, slug: "Kamera" } } : { status: "unknown", cpuPort: null }; } };
  }
  throw new Error(`Unexpected request: ${url}`);
};

const context = {
  document, chrome, fetch: fetchMock, URL, AbortController, console, Date: { now: () => fakeTime },
  setInterval(callback) { intervalCallback = callback; },
  setTimeout(callback, ms) { if (ms === 1000) queueMicrotask(() => { fakeTime += ms; callback(); }); return 1; },
  clearTimeout() {}
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "popup.js"), "utf8"), context);

async function flush() { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); }
async function run() {
  await flush();
  assert.strictEqual(nodes.diagram.children.length, 1, "diagram list is loaded");
  assert.strictEqual(calls[0].url, "http://a.test:1337/rest/diagrams");
  assert.ok(calls.filter(call => !call.options.method).every(call => !call.options.headers), "reads do not send API keys");
  nodes.diagram.value = "room";
  await nodes.diagram.dispatch("change");
  await flush();
  const card = nodes.screens.children[0];
  const select = card.children.find(element => element.tagName === "select");
  const button = card.children.find(element => element.tagName === "button");
  assert.deepStrictEqual(select.children.map(option => option.value), ["", "37"], "only permitted diagram inputs are listed");
  select.value = "37";
  await button.dispatch("click");
  const post = calls.find(call => call.options.method === "POST");
  assert.strictEqual(post.options.headers["X-API-Key"], "old-secret");
  assert.strictEqual(post.options.body, '{"cpuPort":"37"}');
  assert.strictEqual(post.options.redirect, "error", "redirects must never forward the API key");
  assert.ok(calls.slice(calls.indexOf(post) + 1).some(call => call.url.endsWith("/video-connection") && !call.options.method), "the command must be followed by status confirmation");
  assert.match(card.children.at(-1).textContent, /vastaa valintaa/);
  assert.match(card.children.at(-1).textContent, /kuittausta ei voi varmistaa/);
  statusMode = "unknown";
  await button.dispatch("click");
  assert.match(card.children.at(-1).textContent, /Vahvistusta ei saatu/, "a sent command is not treated as confirmed without matching state");
  statusMode = "failure";
  await intervalCallback();
  assert.match(nodes["connection-state"].textContent, /epäonnistui/, "failed refresh must not leave a green connection indicator");
  statusMode = "normal";
  await intervalCallback();
  assert.match(nodes["connection-state"].textContent, /Taisto tavoitettu/, "a successful refresh restores connectivity status");

  nodes["server-url"].value = "http://b.test:1337";
  nodes["server-url"].dispatch("input");
  assert.strictEqual(nodes["api-key"].value, "", "changing server clears the previously displayed key");
  nodes["api-key"].value = "new-secret";
  const saving = nodes.settings.dispatch("submit");
  assert.deepStrictEqual(Array.from(permissionOrigins), ["http://b.test/*"]);
  assert.strictEqual(nodes.controls.hidden, true, "old controls are hidden before awaiting permission");
  const priorPosts = calls.filter(call => call.options.method === "POST").length;
  await button.dispatch("click");
  assert.strictEqual(calls.filter(call => call.options.method === "POST").length, priorPosts, "detached old controls cannot send a request during origin change");
  grant(true);
  await saving;
  await flush();
  nodes.diagram.value = "room";
  await nodes.diagram.dispatch("change");
  await flush();
  const newCard = nodes.screens.children[0];
  const newSelect = newCard.children.find(element => element.tagName === "select");
  const newButton = newCard.children.find(element => element.tagName === "button");
  newSelect.value = "37";
  await newButton.dispatch("click");
  const posts = calls.filter(call => call.options.method === "POST");
  assert.strictEqual(posts.at(-1).url, "http://b.test:1337/rest/con-ports/35/video-connection");
  assert.strictEqual(posts.at(-1).options.headers["X-API-Key"], "new-secret");
  assert.ok(posts.filter(call => call.url.startsWith("http://a.test:")).every(call => call.options.headers["X-API-Key"] !== "new-secret"));
  nodes["server-url"].value = "http://bad.test";
  nodes["server-url"].dispatch("input");
  const invalidSave = nodes.settings.dispatch("submit");
  grant(true);
  await invalidSave;
  assert.strictEqual(nodes.notice.textContent, "Osoitteessa ei vastaa Taiston rajapinta.", "invalid JSON must not display raw server content");
  console.log("Chrome extension popup tests passed");
}

run().catch(error => { console.error(error); process.exitCode = 1; });
