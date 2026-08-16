import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import {
  initializeDatabaseStorage,
  appendAuditLog,
  listAuditLogs,
  closeDatabaseStorage
} from "../backend/storage/SqliteStorage";

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-audit-filter-test-"));

try {
  initializeDatabaseStorage({ sqlitePath: path.join(temporaryDirectory, "taisto.sqlite") });
  appendAuditLog({ createdAt: "2026-08-15T10:00:00.000Z", actorType: "user", actorName: "admin", action: "user.create", path: "/settings/users/data", method: "POST", statusCode: 201, success: true, ipAddress: "127.0.0.1" });
  appendAuditLog({ createdAt: "2026-08-16T10:00:00.000Z", actorType: "api_key", actorName: "companion", action: "con-groups.execute", path: "/rest/con-groups/1/execute", method: "POST", statusCode: 403, success: false, ipAddress: "10.0.0.5" });

  assert.strictEqual(listAuditLogs().total, 2);
  assert.strictEqual(listAuditLogs({ search: "companion" }).total, 1);
  assert.strictEqual(listAuditLogs({ action: "user." }).rows[0].action, "user.create");
  assert.strictEqual(listAuditLogs({ success: "false" }).rows[0].statusCode, 403);
  assert.strictEqual(listAuditLogs({ actorType: "user" }).total, 1);
  assert.strictEqual(listAuditLogs({ from: "2026-08-16T00:00:00.000Z" }).total, 1);
  assert.strictEqual(listAuditLogs({ to: "2026-08-15T23:59:59.999Z" }).total, 1);
  console.log("Audit log filter tests passed");
} finally {
  closeDatabaseStorage();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
