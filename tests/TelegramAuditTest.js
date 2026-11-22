import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import {
  appendAuditLog, closeDatabaseStorage, initializeDatabaseStorage,
  getTelegramConfig, listAuditLogs, saveTelegramConfig, subscribeAuditLog
} from "../backend/storage/SqliteStorage";
import { createTelegramBot } from "../backend/telegram/bot";

// Exercise the same SQLite -> subscriber -> bot chain as the server, without
// starting a matrix connection or contacting a real Telegram chat.
async function run() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-telegram-audit-"));
  const auditChat = "-9000";
  const settings = { enabled: true, token: "12345678:0123456789exampleMock12345", auditEnabled: true, auditChatId: auditChat,
    allowedUserIds: "71331, 81221", allowedUserNames: { "81221": "Ohjaamo" } };
  const sent = [];
  const executed = [];
  const command = (sequence, id, username, preset) => ({ update_id: sequence, message: {
    chat: { id, type: "private" }, from: { id, username, first_name: "Testi" },
    date: Math.floor(Date.now() / 1000), text: "/suorita " + preset
  } });
  const ok = result => ({ ok: true, json: async () => ({ ok: true, result }) });
  const fetchImpl = async (url, { body, signal }) => {
    const payload = JSON.parse(body);
    if (url.endsWith("/sendMessage")) {
      sent.push(payload);
      return ok({});
    }
    assert.ok(url.endsWith("/getUpdates"));
    if (payload.offset === -1) return ok([]);
    if (payload.offset === 0) return ok([command(1, 71331, "sali_test", 3), command(2, 81221, "alias_test", 4)]);
    if (payload.offset === 3) {
      // Rename after the first batch has been executed and logged, but before
      // the bot flushes its batch. Neither history nor authorization may change.
      saveTelegramConfig({ ...settings, allowedUserNames: { "81221": "Ohjaaja" } });
      return ok([command(3, 81221, "alias_test", 5), command(4, 91111, "Ohjaaja", 6)]);
    }
    return new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("stopped")), { once: true }));
  };
  const bot = createTelegramBot({ getConfig: getTelegramConfig, service: { executeDefaultState(id) { executed.push(id); return true; } }, appendAuditLog, fetchImpl,
    timers: { setInterval, clearInterval, clearTimeout, setTimeout: (fn, ms) => setTimeout(fn, ms === 3000 ? 20 : ms) }
  });
  let unsubscribe;
  try {
    initializeDatabaseStorage({ sqlitePath: path.join(dir, "audit.sqlite") });
    saveTelegramConfig(settings);
    unsubscribe = subscribeAuditLog(entry => bot.sendAudit(entry));
    bot.start();
    appendAuditLog({ action: "user.update", actorType: "user", actorId: "8", actorName: "operaattori",
      ipAddress: "2001:db8::7", success: true, details: { password: "PRIVATE_DETAIL" },
      path: "/unused/PRIVATE_PATH", target: "PRIVATE_TARGET", statusCode: 200 });
    const auditMessages = () => sent.filter(msg => msg.chat_id === auditChat).map(msg => msg.text).join("\n");
    const until = Date.now() + 2500;
    while ((auditMessages().match(/telegram\.default_state\.execute/g) || []).length < 3 && Date.now() < until) await delay(10);
    const notice = auditMessages();
    assert.match(notice, /user\.update/);
    assert.match(notice, /Käyttäjä:[^\n]*operaattori/u);
    assert.match(notice, /IP: 2001:db8::7/);
    assert.match(notice, /telegram\.default_state\.execute/);
    assert.match(notice, /@sali_test/);
    assert.match(notice, /71331/);
    assert.match(notice, /Ohjaamo/);
    assert.match(notice, /Ohjaaja/);
    assert.match(notice, /81221/);
    assert.match(notice, /IP: ei saatavilla \(Telegram\)/);
    assert.doesNotMatch(notice, /PRIVATE_DETAIL|PRIVATE_PATH|PRIVATE_TARGET/);
    assert.ok(!notice.includes(settings.token));
    assert.deepEqual(executed, [3, 4, 5], "a matching display name must not grant access to another user ID");
    const commands = listAuditLogs({ actorType: "telegram" }).rows;
    assert.equal(commands.length, 3);
    assert.ok(commands.every(row => row.success && row.ipAddress === ""), "Telegram does not supply the sender's source IP");
    const fallback = commands.find(row => row.target === "3");
    assert.equal(fallback.actorId, "71331");
    assert.match(fallback.actorName, /@sali_test/);
    const original = commands.find(row => row.target === "4");
    const renamed = commands.find(row => row.target === "5");
    assert.equal(original.actorId, "81221");
    assert.equal(renamed.actorId, original.actorId);
    assert.match(original.actorName, /Ohjaamo/);
    assert.match(renamed.actorName, /Ohjaaja/);
    assert.equal(listAuditLogs({ search: "@sali_test" }).total, 1);
    const [web] = listAuditLogs({ search: "2001:db8::7" }).rows;
    assert.equal(web.actorName, "operaattori");
    assert.equal(web.ipAddress, "2001:db8::7");
    console.log("Telegram audit attribution and delivery tests passed");
  } finally {
    if (unsubscribe) unsubscribe();
    await bot.stop();
    closeDatabaseStorage();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
