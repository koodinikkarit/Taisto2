import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { backup, DatabaseSync } from "node:sqlite";
import { closeDatabaseStorage, getProjectorConfig, initializeDatabaseStorage, loadDatabase, saveDatabase, saveProjectorConfig } from "../backend/storage/SqliteStorage";

const defaults = {
  enabled: false, host: "", port: 8001, path: "/cgi-bin/web.cgi",
  powerCategory: "4054", powerToggleCode: "15", powerOnCategory: "", powerOnCode: "", powerOffCategory: "", powerOffCode: ""
};

async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-projector-storage-"));
  const sqlitePath = path.join(directory, "taisto.sqlite");
  const backupPath = path.join(directory, "backup.sqlite");
  try {
    const schema = fs.readFileSync(path.resolve(__dirname, "../backend/storage/schema.sql"), "utf8");
    const snapshot = new DatabaseSync(sqlitePath);
    try { snapshot.exec(schema); } finally { snapshot.close(); }
    initializeDatabaseStorage({ sqlitePath });
    assert.deepEqual(getProjectorConfig(), defaults, "the published schema initializes with control disabled");
    saveDatabase({ diagrams: { 1: { id: 1, slug: "demo" } } });
    closeDatabaseStorage();

    // Reconstruct the preceding schema without erasing existing application data.
    const previous = new DatabaseSync(sqlitePath);
    try { previous.exec("DROP TABLE projector_settings; DELETE FROM schema_migrations WHERE version >= 11"); }
    finally { previous.close(); }
    initializeDatabaseStorage({ sqlitePath });
    assert.deepEqual(getProjectorConfig(), defaults, "v10 databases migrate without enabling a projector");
    assert.equal(loadDatabase().diagrams["1"].slug, "demo");
    const configured = { ...defaults, enabled: true, host: "test-projector.invalid", port: 8123,
      path: "/projector/test.cgi", powerCategory: "ABCD", powerToggleCode: "99",
      powerOnCategory: "AB11", powerOnCode: "11", powerOffCategory: "CD22", powerOffCode: "12" };
    assert.deepEqual(saveProjectorConfig(configured), configured);
    saveDatabase(loadDatabase());
    closeDatabaseStorage();
    initializeDatabaseStorage({ sqlitePath });
    assert.deepEqual(getProjectorConfig(), configured, "a regular app save and restart preserve projector settings");

    // The Drive archive uses the same SQLite online backup API, including committed WAL data.
    const source = new DatabaseSync(sqlitePath, { readOnly: true });
    try { await backup(source, backupPath); } finally { source.close(); }
    closeDatabaseStorage();
    initializeDatabaseStorage({ sqlitePath: backupPath });
    assert.deepEqual(getProjectorConfig(), configured, "the full SQLite backup includes projector settings");
    console.log("Projector schema, migration, persistence and backup tests passed");
  } finally {
    closeDatabaseStorage();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
