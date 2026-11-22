import assert from "assert";
import { createTelegramBot } from "../backend/telegram/bot";

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, timeout = 5000) {
  const end = Date.now() + timeout;
  while (!check()) { if (Date.now() > end) throw new Error("Telegram test timed out"); await wait(10); }
}
const update = (updateId, user, chatType, command, chatId = user) => ({
  update_id: updateId, message: { from: { id: user }, chat: { id: chatId, type: chatType }, text: command, date: Math.floor(Date.now() / 1000) }
});
async function main() {
  let settings = { enabled: true, botToken: "test-token", allowedUserIds: ["123"], auditEnabled: true, auditChatId: "-100123" };
  const requests = [], sent = [], changes = [], audits = [];
  let polls = 0, bootstraps = 0;
  const items = [
    update(51, 456, "private", "/status"),
    update(52, 123, "group", "/status", -12),
    update(53, 456, "private", "/id"),
    update(54, 123, "private", "/status"),
    update(55, 123, "private", "/suorita 4"),
    update(56, 123, "private", "/ryhma 8 9"),
    update(57, 123, "private", "/nayttoryhmat"),
    update(58, 123, "private", "/inputit 8"),
    update(59, 123, "private", "/inputit 8 5"),
    update(60, 123, "private", "/suorita nope"),
    update(61, 456, "private", "/id")
  ];
  const epoch = Math.floor(Date.now() / 1000);
  // Simulate a reconnect delivering an old command, plus malformed and future dates.
  for (const [n, date] of [epoch - 121, undefined, String(epoch), epoch + 3600].entries()) {
    const invalid = update(62 + n, 123, "private", n % 2 ? "/suorita 4" : "/ryhma 8 9");
    invalid.message.date = date;
    items.push(invalid);
  }
  const fetchImpl = async (url, options) => {
    const body = JSON.parse(options.body), method = url.split("/").pop();
    requests.push({ url, body });
    if (method === "sendMessage") { sent.push(body); return { ok: true, json: async () => ({ ok: true, result: {} }) }; }
    if (body.offset === -1) { bootstraps++; return { ok: true, json: async () => ({ ok: true, result: [{ update_id: 50, message: { text: "/suorita 1" } }] }) }; }
    polls++;
    if (polls === 1) return { ok: true, json: async () => ({ ok: true, result: items }) };
    if (polls === 2) return { ok: true, json: async () => ({ ok: true, result: [] }) };
    // Telegram may use a lower ID after a week of inactivity. A stale
    // positive offset would implicitly confirm this new command without delivery.
    if (polls === 3) return { ok: true, json: async () => ({
      ok: true, result: body.offset <= 3 ? [update(3, 123, "private", "/oletustilat")] : []
    }) };
    return new Promise((resolve, reject) => {
      if (options.signal.aborted) return reject(new Error("aborted"));
      options.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    });
  };
  const service = {
    listMatrices: () => [{ id: 1, name: "Demomatriisi" }],
    listDefaultStates: () => [{ id: 4, name: "Perustila" }],
    listGroups: () => [{ id: 8, name: "Sali", inputs: Array.from({ length: 64 }, (_, n) => ({ id: n + 1, name: `PC ${n + 1}` })) }],
    executeDefaultState: id => { changes.push(["default", id]); return true; },
    executeGroup: (group, input) => { changes.push(["group", group, input]); return true; }
  };
  const bot = createTelegramBot({ getConfig: () => settings, service, appendAuditLog: entry => audits.push(entry), fetchImpl });
  bot.start();
  await until(() => polls >= 4);
  assert.deepStrictEqual(requests.filter(entry => entry.url.endsWith("/getUpdates")).slice(0, 5).map(entry => entry.body.offset), [-1, 51, 66, 0, 4]);
  assert.ok(sent.some(entry => entry.text.includes("Perustila")));
  assert.deepStrictEqual(changes, [["default", 4], ["group", 8, 9]]);
  assert.strictEqual(audits.filter(entry => entry.success).length, 2);
  assert.strictEqual(audits.filter(entry => !entry.success).length, 4);
  assert.strictEqual(sent.filter(entry => entry.text.includes("vanhentunut")).length, 4);
  assert.ok(audits.every(entry => entry.actorType === "telegram" && entry.actorId === "123"));
  assert.ok(sent.some(entry => entry.chat_id === "456" && entry.text.includes("456")));
  assert.strictEqual(sent.filter(entry => entry.chat_id === "456").length, 1);
  assert.ok(sent.some(entry => entry.text.includes("Demomatriisi")));
  assert.ok(sent.some(entry => entry.text.includes("Sali") && entry.text.includes("/inputit")));
  assert.ok(sent.some(entry => entry.text.includes("PC 64") && entry.text.includes("Sivu 5/5")));
  assert.ok(!sent.some(entry => entry.chat_id === "-12"));
  assert.strictEqual(bot.sendAudit({ action: "user.create", success: true, details: { password: "DO_NOT_SEND" } }), true);
  assert.strictEqual(bot.sendAudit({ action: "user.update", success: false }), true);
  await until(() => sent.some(entry => entry.chat_id === "-100123"), 5000);
  const audit = sent.find(entry => entry.chat_id === "-100123");
  assert.ok(audit.text.includes("user.create") && audit.text.includes("user.update"));
  assert.ok(!audit.text.includes("DO_NOT_SEND"));
  settings = { ...settings, botToken: "second-token" };
  await until(() => bootstraps === 2, 4000);
  assert.ok(requests.some(entry => entry.url.includes("second-token") && entry.body.offset === -1));
  assert.strictEqual(bot.getStatus().state, "connected");
  await bot.stop();
  assert.strictEqual(bot.getStatus().state, "disabled");

  // Unauthorised /id lookups cannot consume the separate control-command quota.
  const floodReplies = [], floodAudits = [];
  const floodChangesBefore = changes.length;
  let floodDelivered = false;
  const floodItems = Array.from({ length: 30 }, (_, n) => update(201 + n, 1000 + n, "private", "/id"));
  floodItems.push(update(231, 123, "private", "/suorita 4"));
  const floodBot = createTelegramBot({ getConfig: () => settings, service, appendAuditLog: entry => floodAudits.push(entry),
    fetchImpl: async (url, opts) => {
      const body = JSON.parse(opts.body);
      if (url.endsWith("/sendMessage")) {
        floodReplies.push(body);
        return { ok: true, json: async () => ({ ok: true, result: {} }) };
      }
      if (body.offset === -1) return { ok: true, json: async () => ({ ok: true, result: [] }) };
      if (!floodDelivered) {
        floodDelivered = true;
        return { ok: true, json: async () => ({ ok: true, result: floodItems }) };
      }
      return new Promise((resolve, reject) => {
        if (opts.signal.aborted) return reject(new Error("aborted"));
        opts.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      });
    } });
  floodBot.start();
  try {
    await until(() => floodReplies.some(reply => reply.chat_id === "123"));
    assert.strictEqual(floodReplies.filter(reply => reply.chat_id !== "123").length, 30);
    assert.deepStrictEqual(changes.slice(floodChangesBefore), [["default", 4]]);
    assert.strictEqual(floodAudits.length, 1);
    assert.ok(floodReplies.some(reply => reply.chat_id === "123" && reply.text === "Komento lähetetty."));
  } finally { await floodBot.stop(); }

  // Audit delivery is independent of whether incoming bot commands are enabled.
  const auditOnly = [];
  const bot2 = createTelegramBot({ getConfig: () => ({ ...settings, enabled: false }), service, appendAuditLog() {}, fetchImpl: async (url, opts) => {
    auditOnly.push({ url, body: JSON.parse(opts.body) }); return { ok: true, json: async () => ({ ok: true, result: {} }) };
  } });
  bot2.start();
  assert.strictEqual(bot2.sendAudit({ action: "user.create", success: true }), true);
  await until(() => auditOnly.length > 0, 5000);
  assert.strictEqual(auditOnly.length, 1);
  assert.ok(auditOnly[0].url.endsWith("/sendMessage"));
  assert.strictEqual(bot2.sendAudit({ action: "user.update", success: true }), true);
  settings = { ...settings, auditChatId: "-100999" };
  await wait(3200);
  assert.strictEqual(auditOnly.length, 1, "queued notifications must not be redirected to another chat");
  await bot2.stop();

  // A stuck long poll times out and reports a generic error, never the token.
  let aborted = false;
  const fastTimers = { setInterval, clearInterval, clearTimeout,
    setTimeout: (fn, ms) => setTimeout(fn, ms === 40000 ? 30 : ms === 5000 ? 1000 : ms) };
  const stalled = createTelegramBot({ getConfig: () => settings, service, appendAuditLog() {}, timers: fastTimers,
    fetchImpl: async (url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.offset === -1) return { ok: true, json: async () => ({ ok: true, result: [] }) };
      return new Promise((resolve, reject) => opts.signal.addEventListener("abort", () => { aborted = true; reject(new Error(url)); }, { once: true }));
    } });
  stalled.start();
  await until(() => stalled.getStatus().state === "error", 2000);
  assert.ok(aborted);
  assert.ok(!JSON.stringify(stalled.getStatus()).includes(settings.botToken));
  await stalled.stop();
  console.log("Telegram bot tests passed");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
