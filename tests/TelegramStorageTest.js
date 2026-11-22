import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import {
  appendAuditLog, closeDatabaseStorage, exportDatabaseToJson, getTelegramConfig,
  initializeDatabaseStorage, saveDatabase, saveTelegramConfig, subscribeAuditLog
} from "../backend/storage/SqliteStorage";

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-telegram-test-"));
const sqlitePath = path.join(directory, "database.sqlite");
const token = "123456789:abcdefghijklmnopqrstuvwxyz_0123456789";
const config = { enabled: true, token, allowedUserIds: "123, 456\n123", auditEnabled: true, auditChatId: "-1001234567890" };

try {
  initializeDatabaseStorage({ sqlitePath });
  assert.deepStrictEqual(getTelegramConfig(), { enabled: false, botToken: "", allowedUserIds: [], auditEnabled: false, auditChatId: "" });
  assert.throws(() => saveTelegramConfig({ ...config, token: "invalid" }), /token/i);
  assert.throws(() => saveTelegramConfig({ ...config, allowedUserIds: "@user" }), /IDs/i);
  assert.throws(() => saveTelegramConfig({ ...config, token: "" }), /required/i);
  assert.throws(() => saveTelegramConfig({ ...config, enabled: false, token: "" }), /required/i);
  assert.throws(() => saveTelegramConfig({ ...config, auditChatId: "" }), /required/i);
  assert.throws(() => saveTelegramConfig({ ...config, auditChatId: "0" }), /chat ID/i);
  assert.deepStrictEqual(saveTelegramConfig({ ...config, allowedUserIds: "" }).allowedUserIds, [], "empty allowlist supports safe onboarding");
  const saved = saveTelegramConfig(config);
  assert.deepStrictEqual(saved.allowedUserIds, ["123", "456"]);
  assert.strictEqual(saved.botToken, token);
  saveTelegramConfig({ ...config, token: "" });
  assert.strictEqual(getTelegramConfig().botToken, token, "blank token preserves the previous secret");
  saveDatabase({});
  assert.strictEqual(getTelegramConfig().botToken, token, "regular app saves preserve Telegram settings");
  const backup = exportDatabaseToJson(path.join(directory, "backup.json"));
  assert.ok(!fs.readFileSync(backup, "utf8").includes(token), "JSON backups never contain the bot token");
  let notifications = 0;
  const unsubscribe = subscribeAuditLog(() => { notifications++; });
  appendAuditLog({ action: "test", success: true, statusCode: 200 });
  assert.strictEqual(notifications, 1);
  unsubscribe();
  appendAuditLog({ action: "test", success: true, statusCode: 200 });
  assert.strictEqual(notifications, 1, "unsubscribe stops further notifications");
  closeDatabaseStorage();
  initializeDatabaseStorage({ sqlitePath });
  assert.deepStrictEqual(getTelegramConfig().allowedUserIds, ["123", "456"]);
  assert.strictEqual(getTelegramConfig().botToken, token, "settings persist across restarts");
  console.log("Telegram settings storage tests passed");
} finally {
  closeDatabaseStorage();
  fs.rmSync(directory, { recursive: true, force: true });
}
