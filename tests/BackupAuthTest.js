import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import { initializeDatabaseStorage, closeDatabaseStorage, saveDatabase, createUser, updateUser, authenticateUser, countUsers, exportDatabaseToJson } from "../backend/storage/SqliteStorage";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-backup-test-"));
const originalPassword = process.env.TAISTO_PASSWORD;
const originalLegacyImport = process.env.TAISTO_ALLOW_UNPROTECTED_LEGACY_IMPORT;
const originalAnonymousRestore = process.env.TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE;
const sqlite = name => path.join(dir, `${name}.sqlite`);
const json = name => path.join(dir, `${name}.json`);

try {
  delete process.env.TAISTO_PASSWORD;
  delete process.env.TAISTO_ALLOW_UNPROTECTED_LEGACY_IMPORT;
  delete process.env.TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE;
  fs.copyFileSync(path.resolve("tests/fixtures/mock-database.json"), json("mock"));
  process.env.TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE = "true";
  initializeDatabaseStorage({ sqlitePath: sqlite("mock"), jsonPath: json("mock") });
  assert.strictEqual(countUsers(), 0);
  closeDatabaseStorage();
  delete process.env.TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE;
  initializeDatabaseStorage({ sqlitePath: sqlite("original") });
  saveDatabase({});
  createUser({ username: "backup-admin", password: "test-password", role: "admin" });
  fs.writeFileSync(json("backup"), "old backup", { mode: 0o644 });
  if (process.platform !== "win32") fs.chmodSync(json("backup"), 0o644);
  exportDatabaseToJson(json("backup"));
  if (process.platform !== "win32") assert.strictEqual(fs.statSync(json("backup")).mode & 0o777, 0o600, "existing backup permissions must be restricted");
  closeDatabaseStorage();

  initializeDatabaseStorage({ sqlitePath: sqlite("restored"), jsonPath: json("backup") });
  assert.strictEqual(countUsers(), 1);
  assert.strictEqual(authenticateUser("backup-admin", "test-password").role, "admin");
  closeDatabaseStorage();

  initializeDatabaseStorage({ sqlitePath: sqlite("anonymous") });
  saveDatabase({});
  exportDatabaseToJson(json("anonymous"));
  closeDatabaseStorage();
  assert.throws(() => initializeDatabaseStorage({ sqlitePath: sqlite("anonymous-restored"), jsonPath: json("anonymous") }), /TAISTO_PASSWORD is required/);
  closeDatabaseStorage();
  process.env.TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE = "true";
  initializeDatabaseStorage({ sqlitePath: sqlite("anonymous-restored"), jsonPath: json("anonymous") });
  assert.strictEqual(countUsers(), 0);
  closeDatabaseStorage();
  delete process.env.TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE;

  process.env.TAISTO_PASSWORD = "env-password";
  initializeDatabaseStorage({ sqlitePath: sqlite("env") });
  saveDatabase({});
  exportDatabaseToJson(json("env"));
  closeDatabaseStorage();
  delete process.env.TAISTO_PASSWORD;
  assert.throws(() => initializeDatabaseStorage({ sqlitePath: sqlite("env-restored"), jsonPath: json("env") }), /TAISTO_PASSWORD is required/);
  closeDatabaseStorage();
  process.env.TAISTO_PASSWORD = "env-password";
  initializeDatabaseStorage({ sqlitePath: sqlite("env-restored"), jsonPath: json("env") });
  assert.strictEqual(countUsers(), 0);
  closeDatabaseStorage();

  // Exporting in a separate process without the server's environment password
  // must not silently turn an environment-protected installation anonymous.
  delete process.env.TAISTO_PASSWORD;
  initializeDatabaseStorage({ sqlitePath: sqlite("env") });
  exportDatabaseToJson(json("env-offline"));
  closeDatabaseStorage();
  assert.throws(() => initializeDatabaseStorage({ sqlitePath: sqlite("env-offline-restored"), jsonPath: json("env-offline") }), /TAISTO_PASSWORD is required/);
  closeDatabaseStorage();

  initializeDatabaseStorage({ sqlitePath: sqlite("user-only") });
  saveDatabase({});
  const user = createUser({ username: "example-user", password: "test-password", role: "admin" });
  updateUser(user.id, { role: "user" }, { allowNoAdmin: true });
  exportDatabaseToJson(json("user-only"));
  closeDatabaseStorage();
  process.env.TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE = "true";
  assert.throws(() => initializeDatabaseStorage({ sqlitePath: sqlite("user-only-restored"), jsonPath: json("user-only") }), /TAISTO_PASSWORD is required/);
  closeDatabaseStorage();
  delete process.env.TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE;

  delete process.env.TAISTO_PASSWORD;
  fs.writeFileSync(json("legacy"), JSON.stringify({ nextMatrixId: 5 }));
  assert.throws(() => initializeDatabaseStorage({ sqlitePath: sqlite("legacy"), jsonPath: json("legacy") }), /Legacy JSON may not contain user accounts/);
  closeDatabaseStorage();
  process.env.TAISTO_ALLOW_UNPROTECTED_LEGACY_IMPORT = "true";
  initializeDatabaseStorage({ sqlitePath: sqlite("legacy"), jsonPath: json("legacy") });
  assert.strictEqual(countUsers(), 0);
  closeDatabaseStorage();
  delete process.env.TAISTO_ALLOW_UNPROTECTED_LEGACY_IMPORT;
  process.env.TAISTO_PASSWORD = "env-password";
  initializeDatabaseStorage({ sqlitePath: sqlite("legacy-with-password"), jsonPath: json("legacy") });
  assert.strictEqual(countUsers(), 0);
  closeDatabaseStorage();
  console.log("backup authentication tests passed");
} finally {
  closeDatabaseStorage();
  if (originalPassword === undefined) delete process.env.TAISTO_PASSWORD;
  else process.env.TAISTO_PASSWORD = originalPassword;
  if (originalLegacyImport === undefined) delete process.env.TAISTO_ALLOW_UNPROTECTED_LEGACY_IMPORT;
  else process.env.TAISTO_ALLOW_UNPROTECTED_LEGACY_IMPORT = originalLegacyImport;
  if (originalAnonymousRestore === undefined) delete process.env.TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE;
  else process.env.TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE = originalAnonymousRestore;
  fs.rmSync(dir, { recursive: true, force: true });
}
