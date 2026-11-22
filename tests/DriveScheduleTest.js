import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { DatabaseSync } from "node:sqlite";
import { createDriveBackupService } from "../backend/drive/service";
import * as store from "../backend/storage/SqliteStorage";

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-drive-schedule-"));
  const sqlitePath = path.join(dir, "taisto.sqlite");
  const keyPath = path.join(dir, "key"), oauthPath = path.join(dir, "oauth");
  let uploadCount = 0, fail = false, time = "2026-03-29T00:59:00Z";
  const options = {
    keyPath, oauthPath, now: () => new Date(time),
    snapshot: async (params, send) => { assert.deepEqual(params, { keyPath, sqlitePath }); return send("encrypted"); },
    upload: async params => {
      uploadCount++;
      assert.equal(params.filePath, "encrypted");
      assert.equal(params.folderId, "PrivateFolder");
      if (fail) throw new Error("secret remote response");
      return { id: "verified", size: 1000 };
    }
  };
  try {
    store.initializeDatabaseStorage({ sqlitePath });
    // Start from a disposable v9 database with an existing Telegram alias.
    store.saveTelegramConfig({ enabled: false, allowedUserIds: "42", allowedUserNames: {42: "Ohjaaja"}, auditEnabled: false, auditChatId: "" });
    store.closeDatabaseStorage();
    const db = new DatabaseSync(sqlitePath);
    try { db.exec("DROP TABLE drive_backup; DELETE FROM schema_migrations WHERE version=10"); } finally { db.close(); }
    store.initializeDatabaseStorage({ sqlitePath });
    assert.equal(store.getTelegramConfig().allowedUserNames["42"], "Ohjaaja");
    let service = createDriveBackupService(options);
    assert.equal(service.status().enabled, false);
    assert.throws(() => service.configure({ enabled: true, folderId: "PrivateFolder" }), /key files/);
    fs.writeFileSync(keyPath, Buffer.alloc(32));
    fs.writeFileSync(oauthPath, "{}");
    assert.throws(() => service.configure({ enabled: true, folderId: "https://not-a-folder/" }), /folder ID/);
    service.configure({ enabled: true, folderId: "PrivateFolder" });
    service.tick();
    assert.equal(service.status().lastAttemptAt, "", "not due before 03 local time");
    time = "2026-03-29T01:01:00Z"; // spring skip: 04:01 Helsinki
    service.tick();
    assert.equal(service.status().running, true);
    assert.throws(() => service.run({ id: "1", name: "admin", ip: "127.0.0.1" }), /already running/);
    assert.throws(() => service.configure({ enabled: false, folderId: "Other" }), /already running/);
    await service.stop();
    assert.equal(uploadCount, 1);
    assert.equal(service.status().lastSuccessAt, new Date(time).toISOString());
    const firstFile = service.status().lastFilename;
    store.closeDatabaseStorage();
    store.initializeDatabaseStorage({ sqlitePath });
    service = createDriveBackupService(options);
    service.tick(); await service.stop();
    assert.equal(uploadCount, 1, "don't repeat today's verified backup on restart");

    time = "2026-10-25T00:01:00Z"; // first 03:01 in autumn
    fail = true;
    service.tick(); await service.stop();
    assert.equal(uploadCount, 2);
    assert.ok(service.status().lastError && !service.status().lastError.includes("secret"));
    assert.equal(service.status().lastFilename, firstFile, "keep previous verified backup when upload fails");
    time = "2026-10-25T00:15:59Z";
    service.tick(); await service.stop();
    assert.equal(uploadCount, 2);
    time = "2026-10-25T00:16:00Z";
    fail = false; service.tick(); await service.stop();
    time = "2026-10-25T01:01:00Z"; // second 03:01
    service.tick(); await service.stop();
    assert.equal(uploadCount, 3);
    service.configure({ enabled: false, folderId: "PrivateFolder" });
    time = "2026-10-26T13:00:00Z"; service.tick(); await service.stop();
    assert.equal(uploadCount, 3, "disabled schedule never uploads");
    service.run({ id: "7", name: "admin", ip: "192.0.2.9" }); await service.stop();
    assert.equal(uploadCount, 4, "manual backup works while the schedule is disabled");
    const { rows } = store.listAuditLogs({ action: "drive_backup.result" });
    assert.equal(rows[0].actorName, "admin"); assert.equal(rows[0].ipAddress, "192.0.2.9");
    assert.ok(rows.some(row => !row.success && row.actorType === "scheduler"));
    assert.equal(service.status().lastError, "");
    console.log("Drive backup migration, scheduling, status and audit tests passed");
  } finally {
    store.closeDatabaseStorage();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
