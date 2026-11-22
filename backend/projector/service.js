import { isIP } from "node:net";

// Same device protocol and presets as the independently packaged Companion plugin.
const presets = new Map([
  ["freeze", ["855A", "67"]],
  ["picture_blank", ["4054", "24"]], ["input_video", ["4054", "2A"]],
  ["input_a", ["4054", "2B"]], ["input_b", ["4054", "2C"]],
  ["input_c", ["4054", "6F"]], ["input_d", ["4054", "70"]]
]);
const inputs = ["input1", "input2", "input3", "input4", "input5"];
const defaults = { enabled: false, host: "", port: 8001, path: "/cgi-bin/web.cgi",
  powerCategory: "4054", powerToggleCode: "15", powerOnCategory: "", powerOnCode: "", powerOffCategory: "", powerOffCode: "" };
const maxBody = 64 * 1024;

export class ProjectorError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function invalid(message) { throw new ProjectorError(400, message); }

function powerPair(config, id) {
  if (id === "power_toggle") return [config.powerCategory, config.powerToggleCode];
  if (id === "power_on") return [config.powerOnCategory || config.powerCategory, config.powerOnCode];
  if (id === "power_off") return [config.powerOffCategory || config.powerCategory, config.powerOffCode];
  return null;
}

function powerSettings(value) {
  const power = {};
  for (const key of ["powerCategory", "powerToggleCode", "powerOnCategory", "powerOnCode", "powerOffCategory", "powerOffCode"]) {
    const v = value[key];
    const optional = key !== "powerCategory" && key !== "powerToggleCode";
    const format = key.endsWith("Category") ? /^[a-f0-9]{4}$/i : /^[a-f0-9]{2}$/i;
    if (typeof v !== "string" || (!(optional && v === "") && !format.test(v)))
      invalid("Power command categories must have four hex digits and codes two hex digits");
    power[key] = v.toUpperCase();
  }
  const used = new Set(["4054/15", powerPair(power, "power_toggle").join("/")]);
  for (const id of ["power_on", "power_off"]) {
    const pair = powerPair(power, id);
    if (!pair[1]) continue;
    const key = pair.join("/");
    if (used.has(key)) invalid("Use distinct power commands, not the power toggle command");
    used.add(key);
  }
  return power;
}

function settings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    typeof value.enabled !== "boolean" || typeof value.host !== "string")
    invalid("Expected projector settings");
  const config = { ...defaults, ...value };
  let { host, port, path } = config;
  host = host.trim().toLowerCase();
  if (host.startsWith("[") && host.endsWith("]") && isIP(host.slice(1, -1)) === 6) host = host.slice(1, -1);
  if (host.includes("%") || (value.enabled && !host)) invalid("Invalid projector hostname or IP address");
  if (host && !isIP(host)) {
    // Disallow alternative numeric IP spellings which WHATWG URL silently rewrites.
    let normalized;
    try { normalized = new URL("http://" + host).hostname; } catch {}
    if (normalized !== host || host.length > 253 ||
      !host.split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))
      invalid("Invalid projector hostname or IP address");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) invalid("Invalid projector port");
  if (typeof path !== "string" || path.length > 256 || !/^\/[A-Za-z0-9._~/-]*$/.test(path) ||
    path.includes("//") || path.split("/").some(part => part === "." || part === ".."))
    invalid("Expected a projector CGI path, not a URL");
  return { enabled: value.enabled, host, port, path, ...powerSettings(config) };
}

async function readStatus(response) {
  if (!response.body || Number(response.headers.get("content-length")) > maxBody)
    throw new ProjectorError(502, "Invalid projector status response");
  let length = 0;
  const chunks = [];
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > maxBody) throw new ProjectorError(502, "Projector status is too large");
    chunks.push(chunk);
  }
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch {}
  if (!data || typeof data !== "object" || Array.isArray(data) ||
    (!Object.hasOwn(data, "current_power_is_on") && !Object.hasOwn(data, "current_input")))
    throw new ProjectorError(502, "Invalid projector status response");
  const rawPower = data.current_power_is_on;
  const power = typeof rawPower === "string" ? rawPower.trim().toLowerCase() : rawPower;
  const powerOn = [true, 1, "1", "true", "on"].includes(power) ? true :
    [false, 0, "0", "false", "off"].includes(power) ? false : null;
  const currentInput = typeof data.current_input === "string" && data.current_input.length <= 80 ?
    data.current_input.trim() || null : null;
  const labels = {};
  for (const input of inputs) {
    const label = data.label && data.label[input];
    if (typeof label === "string" && label.trim()) labels[input] = label.trim().slice(0, 128);
  }
  return { powerOn, currentInput, labels };
}

export function createProjectorService({ getConfig, saveConfig, fetchImpl = fetch, now = Date.now, timeoutMs = 4000 }) {
  let busy = false, nextCommandAt = 0, reading = null;
  const getSettings = () => settings({ ...defaults, ...getConfig() });
  const expired = () => new ProjectorError(409, "Projector settings changed; refresh status");
  let generation = 0;
  function configure(body) {
    if (busy) throw new ProjectorError(409, "A projector command is in progress");
    const config = settings(body);
    saveConfig(config);
    generation++;
    reading = null;
    return config;
  }
  async function request(config, req, param) {
    const host = isIP(config.host) === 6 ? "[" + config.host + "]" : config.host;
    const address = "http://" + host + ":" + config.port + config.path;
    const signal = AbortSignal.timeout(timeoutMs);
    let response;
    try {
      response = await fetchImpl(address, { method: "POST", redirect: "error", signal,
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(param ? { req, param } : { req }) });
      if (!response.ok) throw new ProjectorError(502, "Projector rejected the request");
      return param ? undefined : await readStatus(response);
    } catch (error) {
      if (error instanceof ProjectorError) throw error;
      throw signal.aborted ? new ProjectorError(504, "Projector request timed out") :
        new ProjectorError(502, "Could not communicate with the projector");
    } finally {
      if (response && response.body && !response.bodyUsed) response.body.cancel().catch(() => {});
    }
  }
  async function status() {
    const config = getSettings();
    const base = { enabled: config.enabled, canPowerOn: Boolean(config.enabled && config.powerOnCode),
      canPowerOff: Boolean(config.enabled && config.powerOffCode), powerOn: null, currentInput: null, labels: {} };
    if (!config.enabled) return base;
    if (!reading) {
      const at = generation;
      reading = request(config, { type: "get", category: "control", lang: "en" })
        .then(state => { if (at !== generation) throw expired(); return { ...base, ...state }; })
        .finally(() => { if (at === generation) reading = null; });
    }
    return reading;
  }
  async function command(id) {
    const config = getSettings();
    if (!config.enabled) throw new ProjectorError(409, "Projector control is disabled");
    const pair = presets.get(id) || powerPair(config, id);
    if (!pair) throw new ProjectorError(400, "Unknown projector command");
    if (!pair[1]) throw new ProjectorError(409, "Discrete power command is not configured");
    if (busy || now() < nextCommandAt) throw new ProjectorError(429, "Please wait before sending another projector command");
    busy = true;
    nextCommandAt = now() + 2000;
    try {
      await request(config, { type: "send", category: "control" }, { category: pair[0], code: pair[1] });
      return { accepted: true, command: id };
    } finally { busy = false; }
  }
  return { getSettings, configure, status, command };
}
