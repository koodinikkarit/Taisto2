import { telegramAuditActor, telegramAuditLine } from "./audit";

// Telegram is optional. The bot token is never included in logs or audit data.
// A single worker owns the update offset; commands are deliberately not retried.
const POLL_SECONDS = 25;
const RETRY_MS = 5000;
const CHECK_MS = 1000;
const MAX_MESSAGE = 3500;
const MAX_CONTROL_AGE_SECONDS = 120;

const text = (value, length = 100) => String(value == null ? "" : value)
  .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, " ").slice(0, length);
const id = value => /^[1-9]\d{0,14}$/.test(String(value || "")) ? Number(value) : null;
const allowedIds = value => Array.isArray(value) ? value.map(String) : [];

/**
 * service: listMatrices/listDefaultStates/listGroups return arrays with {id,name};
 * groups additionally contain inputs [{id,name}]. executeDefaultState(id) and
 * executeGroup(groupId,inputId) return true only when a command was accepted.
 * getConfig() returns {enabled,botToken,allowedUserIds,allowedUserNames,auditEnabled,auditChatId}.
 */
export function createTelegramBot({ getConfig, service, appendAuditLog, fetchImpl = fetch, timers = globalThis }) {
  let running = false;
  let worker = null;
  let watcher = null;
  let controller = null;
  let wake = null;
  let activeToken = "";
  let offset = null;
  let connectionState = "disabled", lastError = "";
  let auditTimer = null;
  let auditController = null;
  let auditBusy = false;
  let auditContext = "";
  const auditQueue = [];
  const idReplies = new Map();
  let commandWindow = 0, commandCount = 0;
  let idWindow = 0, idCount = 0;

  function config() {
    try { return getConfig() || {}; } catch { return {}; }
  }
  function tokenOf(value) {
    return value.enabled && typeof value.botToken === "string" ? value.botToken.trim() : "";
  }
  function auditTokenOf(value) {
    return value.auditEnabled && typeof value.botToken === "string" ? value.botToken.trim() : "";
  }
  function pause(ms) {
    return new Promise(resolve => {
      const timer = timers.setTimeout(() => { wake = null; resolve(); }, ms);
      if (timer && typeof timer.unref === "function") timer.unref();
      wake = () => { timers.clearTimeout(timer); wake = null; resolve(); };
    });
  }
  function onConfigChange() {
    const current = config();
    if (tokenOf(current) !== activeToken) {
      if (controller) controller.abort();
      if (wake) wake();
    }
    if (auditController && auditContext !== JSON.stringify([auditTokenOf(current), String(current.auditChatId || "").trim()])) auditController.abort();
  }
  async function api(token, method, body, signal) {
    const requestController = new AbortController();
    const abort = () => requestController.abort();
    if (signal) {
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    }
    const timeout = method === "getUpdates" && body.timeout ? 40000 : 10000;
    const deadline = timers.setTimeout(abort, timeout);
    if (deadline && typeof deadline.unref === "function") deadline.unref();
    try {
      const response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: requestController.signal
      });
      if (!response.ok) throw new Error("Telegram request failed");
      const data = await response.json();
      if (!data || data.ok !== true) throw new Error("Telegram request failed");
      return data.result;
    } finally {
      timers.clearTimeout(deadline);
      if (signal) signal.removeEventListener("abort", abort);
    }
  }
  async function reply(token, chatId, message, signal) {
    if (!running || tokenOf(config()) !== token) return;
    await api(token, "sendMessage", { chat_id: String(chatId), text: String(message).slice(0, MAX_MESSAGE), disable_web_page_preview: true }, signal);
  }
  function authorized(update, current) {
    const msg = update && update.message;
    if (!msg || !msg.from || msg.from.is_bot || !msg.chat || msg.chat.type !== "private") return false;
    const userId = String(msg.from.id || "");
    return /^[1-9]\d{0,19}$/.test(userId) && String(msg.chat.id) === userId && allowedIds(current.allowedUserIds).includes(userId);
  }
  function listing(title, entries, requestedPage, command) {
    const pageSize = 15;
    const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
    const page = id(requestedPage || 1);
    if (!page || page > totalPages) return `Virheellinen sivu. Valitse sivu 1–${totalPages}.`;
    const rows = entries.slice((page - 1) * pageSize, page * pageSize).map(item => `${text(item.id, 24)}: ${text(item.name)}`);
    return `${title}\n${rows.join("\n") || "Ei tietoja."}\nSivu ${page}/${totalPages}${page < totalPages ? ` · Seuraava: ${command} ${page + 1}` : ""}`;
  }
  function withinCommandLimit() {
    const now = Date.now();
    if (now - commandWindow >= 60000) { commandWindow = now; commandCount = 0; }
    if (commandCount >= 30) return false;
    commandCount++;
    return true;
  }
  function withinIdLimit() {
    const now = Date.now();
    if (now - idWindow >= 60000) { idWindow = now; idCount = 0; }
    if (idCount >= 30) return false;
    idCount++;
    return true;
  }
  function logAction(actor, action, target, success) {
    try {
      if (typeof appendAuditLog === "function") appendAuditLog({
        ...actor,
        action, target, method: "TELEGRAM", path: "", statusCode: success ? 200 : 400,
        success, ipAddress: "", details: {}
      });
    } catch { /* Audit failure must not retry an already executed command. */ }
  }
  async function handleUpdate(update, token, signal) {
    const current = config();
    if (tokenOf(current) !== token) return;
    const incoming = update && update.message;
    if (incoming && incoming.chat && incoming.chat.type === "private" && incoming.from && !incoming.from.is_bot &&
        /^[1-9]\d{0,19}$/.test(String(incoming.from.id || "")) && String(incoming.from.id) === String(incoming.chat.id) &&
        String(incoming.text || "").trim().toLowerCase() === "/id") {
      const key = String(incoming.from.id), now = Date.now();
      if (now - (idReplies.get(key) || 0) < 10000 || !withinIdLimit()) return;
      idReplies.delete(key); idReplies.set(key, now);
      if (idReplies.size > 1000) idReplies.delete(idReplies.keys().next().value);
      await reply(token, String(incoming.chat.id), `Telegram-käyttäjätunnuksesi: ${incoming.from.id}`, signal);
      return;
    }
    if (!authorized(update, current)) return;
    const message = update.message;
    const parts = String(message.text || "").trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const chatId = String(message.chat.id);
    if (!withinCommandLimit()) return;
    if (command === "/start" || command === "/help") {
      await reply(token, chatId, "Taisto\n/id – oma Telegram-ID\n/status [sivu] – matriisit\n/oletustilat [sivu] – oletustilat\n/suorita ID – suorita oletustila\n/nayttoryhmat [sivu] – näyttöryhmät\n/inputit RYHMA_ID [sivu] – ryhmän inputit\n/ryhma RYHMA_ID INPUT_ID – vaihda näyttöryhmän input", signal);
    } else if (command === "/status") {
      await reply(token, chatId, listing("Matriisit:", await service.listMatrices(), parts[1], "/status"), signal);
    } else if (command === "/oletustilat") {
      await reply(token, chatId, listing("Oletustilat:", await service.listDefaultStates(), parts[1], "/oletustilat"), signal);
    } else if (command === "/nayttoryhmat") {
      const groups = await service.listGroups();
      await reply(token, chatId, listing("Näyttöryhmät (inputit: /inputit RYHMA_ID):", groups, parts[1], "/nayttoryhmat"), signal);
    } else if (command === "/inputit") {
      const groupId = id(parts[1]);
      if (!groupId) { await reply(token, chatId, "Käyttö: /inputit RYHMA_ID [sivu]", signal); return; }
      const groups = await service.listGroups();
      const group = groups.find(item => Number(item.id) === groupId);
      if (!group) { await reply(token, chatId, "Näyttöryhmää ei löytynyt.", signal); return; }
      await reply(token, chatId, listing(`Inputit: ${text(group.name)}`, group.inputs || [], parts[2], `/inputit ${groupId}`), signal);
    } else if (command === "/suorita" || command === "/ryhma") {
      const firstId = id(parts[1]);
      const secondId = command === "/ryhma" ? id(parts[2]) : null;
      if (!firstId || (command === "/ryhma" && !secondId) || parts.length !== (command === "/ryhma" ? 3 : 2)) {
        await reply(token, chatId, command === "/suorita" ? "Käyttö: /suorita ID" : "Käyttö: /ryhma RYHMA_ID INPUT_ID", signal);
        return;
      }
      // Revalidate live permission immediately before the state-changing action.
      const commandConfig = config();
      if (!running || tokenOf(commandConfig) !== token || !authorized(update, commandConfig)) return;
      const actor = telegramAuditActor(message.from, commandConfig.allowedUserNames);
      const action = command === "/suorita" ? "telegram.default_state.execute" : "telegram.con_group.execute";
      const target = command === "/suorita" ? String(firstId) : `${firstId}:${secondId}`;
      // Telegram may deliver queued messages after an outage. Never perform a
      // delayed switch or assume a missing/invalid timestamp means "just now".
      const now = Math.floor(Date.now() / 1000);
      if (!Number.isSafeInteger(message.date) || message.date <= 0 || message.date > now || now - message.date > MAX_CONTROL_AGE_SECONDS) {
        logAction(actor, action, target, false);
        await reply(token, chatId, "Komennon aika ei kelpaa tai komento on vanhentunut. Lähetä komento uudelleen.", signal);
        return;
      }
      let success = false;
      try { success = (command === "/suorita" ? await service.executeDefaultState(firstId) : await service.executeGroup(firstId, secondId)) === true; } catch { /* Generic response; never include errors or URLs. */ }
      logAction(actor, action, target, success);
      await reply(token, chatId, success ? "Komento lähetetty." : "Komentoa ei voitu suorittaa.", signal);
    }
  }
  async function run() {
    while (running) {
      const token = tokenOf(config());
      if (token !== activeToken) { activeToken = token; offset = null; connectionState = token ? "connecting" : "disabled"; lastError = ""; }
      if (!token) { await pause(RETRY_MS); continue; }
      controller = new AbortController();
      const signal = controller.signal;
      try {
        if (offset === null) {
          // A newly enabled/changed token must never replay old queued commands.
          const last = await api(token, "getUpdates", { offset: -1, limit: 1, timeout: 0, allowed_updates: ["message"] }, signal);
          if (!running || tokenOf(config()) !== token) continue;
          offset = Array.isArray(last) && last.length ? Number(last[last.length - 1].update_id) + 1 : 0;
          connectionState = "connected"; lastError = "";
        }
        const updates = await api(token, "getUpdates", { offset, timeout: POLL_SECONDS, allowed_updates: ["message"] }, signal);
        if (!running || tokenOf(config()) !== token) continue;
        connectionState = "connected"; lastError = "";
        // An empty successful poll acknowledged the previous batch. Start the
        // next poll at the oldest unconfirmed update: Telegram can choose a
        // lower update_id after a week without new updates.
        if (Array.isArray(updates) && updates.length === 0) offset = 0;
        for (const update of Array.isArray(updates) ? updates : []) {
          if (!running || tokenOf(config()) !== token) break;
          if (!Number.isSafeInteger(update.update_id) || update.update_id < offset) continue;
          // Advance before execution: response/delivery failures do not repeat a command.
          offset = update.update_id + 1;
          try { await handleUpdate(update, token, signal); } catch { /* No sensitive URLs/errors in logs. */ }
        }
      } catch {
        if (running && tokenOf(config()) === token) {
          connectionState = "error"; lastError = "Telegram-yhteys ei toimi. Tarkista bottitoken ja verkkoyhteys.";
          await pause(RETRY_MS);
        }
      } finally { controller = null; }
    }
  }
  function scheduleAudit() {
    if (auditTimer || !running) return;
    auditTimer = timers.setTimeout(() => { auditTimer = null; void flushAudit(); }, 3000);
    if (auditTimer && typeof auditTimer.unref === "function") auditTimer.unref();
  }
  async function flushAudit() {
    if (!running || auditBusy) return;
    const current = config(), token = auditTokenOf(current), chatId = String(current.auditChatId || "").trim();
    // Never redirect previously queued events to a newly configured chat.
    const eligible = auditQueue.splice(0).filter(item => current.auditEnabled && token && item.token === token && item.chatId === chatId);
    if (!eligible.length) return;
    const lines = [];
    while (eligible.length && lines.join("\n").length + eligible[0].line.length < MAX_MESSAGE - 30) lines.push(eligible.shift().line);
    if (eligible.length) auditQueue.unshift(...eligible);
    auditBusy = true;
    auditController = new AbortController();
    auditContext = JSON.stringify([token, chatId]);
    const deadline = timers.setTimeout(() => auditController && auditController.abort(), 10000);
    try { await api(token, "sendMessage", { chat_id: chatId, text: `Taisto audit\n${lines.join("\n")}`, disable_web_page_preview: true }, auditController.signal); }
    catch { /* SQLite remains the source of truth, delivery errors do not block Taisto. */ }
    finally {
      timers.clearTimeout(deadline); auditController = null; auditContext = ""; auditBusy = false;
      if (auditQueue.length) scheduleAudit();
    }
  }
  return {
    start() {
      if (running) return;
      running = true;
      watcher = timers.setInterval(onConfigChange, CHECK_MS);
      if (watcher && typeof watcher.unref === "function") watcher.unref();
      worker = run();
    },
    async stop() {
      running = false;
      if (watcher) timers.clearInterval(watcher);
      watcher = null;
      if (controller) controller.abort();
      if (wake) wake();
      if (auditTimer) timers.clearTimeout(auditTimer);
      auditTimer = null;
      if (auditController) auditController.abort();
      auditQueue.length = 0;
      if (worker) await worker;
      worker = null; activeToken = ""; offset = null;
      connectionState = "disabled"; lastError = "";
    },
    getStatus() {
      const token = tokenOf(config());
      if (!running || !token) return { state: "disabled", error: "" };
      if (token !== activeToken) return { state: "connecting", error: "" };
      return { state: connectionState, error: lastError };
    },
    sendAudit(entry) {
      const current = config(), token = auditTokenOf(current);
      const chatId = String(current.auditChatId || "").trim();
      if (!running || !token || !current.auditEnabled || !/^-?[1-9]\d{0,19}$/.test(chatId)) return false;
      if (auditQueue.length >= 100) auditQueue.shift();
      auditQueue.push({ token, chatId, line: telegramAuditLine(entry) });
      scheduleAudit();
      return true;
    }
  };
}
