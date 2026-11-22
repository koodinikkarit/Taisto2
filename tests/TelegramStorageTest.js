import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import { DatabaseSync } from "node:sqlite";
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
  assert.deepStrictEqual(getTelegramConfig(), { enabled: false, botToken: "", allowedUserIds: [], allowedUserNames: {}, auditEnabled: false, auditChatId: "" });
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
  const names = { "123": "Pääsali operaattori", "456": "Ohjaaja" };
  assert.deepStrictEqual(saveTelegramConfig({ ...config, allowedUserNames: { "123": "  Pa\u0308a\u0308sali   operaattori ", "456": "Ohjaaja" } }).allowedUserNames, names);
  for (const invalid of [null, [], "Ohjaaja", { "999": "Unlisted" }, { "123": 42 }, { "456": "a".repeat(81) },
    { "123": "LA\nSF" }, { "123": "\u202eX" }, { "456": "\u061cOhjaaja" }, { "456": "A\u2028B" }, { "123": "\udc00" },
    JSON.parse('{"__proto__":"bad"}')]) {
    assert.throws(() => saveTelegramConfig({ ...config, enabled: false, allowedUserNames: invalid }), /Invalid Telegram user names/);
  }
  assert.strictEqual(getTelegramConfig().enabled, true, "invalid names do not partially save other settings");
  assert.deepStrictEqual(getTelegramConfig().allowedUserNames, names);
  assert.deepStrictEqual(saveTelegramConfig({ ...config }).allowedUserNames, names, "old clients preserve names");
  assert.deepStrictEqual(saveTelegramConfig({ ...config, allowedUserIds: "123" }).allowedUserNames, { "123": names["123"] });
  assert.deepStrictEqual(saveTelegramConfig(config).allowedUserNames, { "123": names["123"] }, "re-adding an ID does not revive its old name");
  assert.deepStrictEqual(saveTelegramConfig({ ...config, allowedUserNames: { "123": "  " } }).allowedUserNames, {});
  saveTelegramConfig({ ...config, allowedUserNames: names });
  saveTelegramConfig({ ...config, token: "" });
  assert.strictEqual(getTelegramConfig().botToken, token, "blank token preserves the previous secret");
  saveDatabase({});
  assert.strictEqual(getTelegramConfig().botToken, token, "regular app saves preserve Telegram settings");
  const backup = exportDatabaseToJson(path.join(directory, "backup.json"));
  assert.ok(!fs.readFileSync(backup, "utf8").includes(token), "JSON backups never contain the bot token");
  assert.ok(!fs.readFileSync(backup, "utf8").includes(names["123"]), "Telegram aliases are omitted from JSON backups");
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
  assert.deepStrictEqual(getTelegramConfig().allowedUserNames, names, "aliases persist across restarts");
  assert.strictEqual(getTelegramConfig().botToken, token, "settings persist across restarts");
  // Model the last release by removing only the v9 addition in this disposable DB.
  // The migration must not discard the token, allowlist or notification settings.
  closeDatabaseStorage();
  const previous = new DatabaseSync(sqlitePath);
  try { previous.exec("DROP TABLE drive_backup; ALTER TABLE telegram_settings DROP COLUMN allowed_user_names; DELETE FROM schema_migrations WHERE version >= 9;"); }
  finally { previous.close(); }
  initializeDatabaseStorage({ sqlitePath });
  assert.deepStrictEqual(getTelegramConfig(), { ...saved, allowedUserNames: {} }, "v8 settings migrate with empty names");
  console.log("Telegram settings storage tests passed");
} finally {
  closeDatabaseStorage();
  fs.rmSync(directory, { recursive: true, force: true });
}
