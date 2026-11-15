import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-env-session-"));
const sqlitePath = path.join(directory, "test.sqlite");
const source = `
const storage = require('./backend/storage/SqliteStorage');
const auth = require('./backend/auth');
storage.initializeDatabaseStorage({ sqlitePath: process.env.TEST_SQLITE });
if (process.env.TEST_TOKEN) {
  const request = { headers: { cookie: auth.sessionCookieName + '=' + process.env.TEST_TOKEN } };
  process.stdout.write(String(Boolean(auth.getSessionIdentity(request))));
} else {
  const identity = auth.authenticateCredentials('taisto', process.env.TAISTO_PASSWORD);
  process.stdout.write(auth.createSessionToken(identity));
}
storage.closeDatabaseStorage();`;
function child(password, token) {
  const result = spawnSync(process.execPath, ["-r", "@babel/register", "-e", source], {
    cwd: path.resolve(__dirname, ".."), encoding: "utf8",
    env: { ...process.env, NODE_ENV: "production", TEST_SQLITE: sqlitePath, TAISTO_USER: "taisto", TAISTO_PASSWORD: password, TEST_TOKEN: token || "" }
  });
  assert.strictEqual(result.status, 0, result.stderr);
  return result.stdout.trim();
}
try {
  const token = child("old-test-password");
  assert.strictEqual(child("old-test-password", token), "true", "the same environment credentials retain the session after restart");
  assert.strictEqual(child("new-test-password", token), "false", "changing the environment password invalidates old sessions");
  console.log("Environment session tests passed");
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
