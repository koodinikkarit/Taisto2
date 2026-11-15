import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import { initializeDatabaseStorage, closeDatabaseStorage, createUser, authenticateUserAsync } from "../backend/storage/SqliteStorage";

async function run() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-async-auth-"));
  try {
    initializeDatabaseStorage({ sqlitePath: path.join(directory, "test.sqlite") });
    createUser({ username: "operator", password: "test-password", role: "admin" });
    const checks = Array.from({ length: 4 }, () => authenticateUserAsync("operator", "test-password"));
    await assert.rejects(authenticateUserAsync("operator", "test-password"), error => error.status === 429);
    assert.ok((await Promise.all(checks)).every(user => user.username === "operator"));
    assert.strictEqual(await authenticateUserAsync("operator", "bad-password"), null);
    console.log("Async authentication tests passed");
  } finally {
    closeDatabaseStorage();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
