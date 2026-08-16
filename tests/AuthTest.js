import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import {
  initializeDatabaseStorage,
  countAdminUsers,
  countUsers,
  listUsers,
  createUser,
  authenticateUser,
  recordUserLogin,
  updateUser,
  deleteUser,
  getAuthSessionSecret,
  closeDatabaseStorage
} from "../backend/storage/SqliteStorage";
import { createSessionToken, getSessionIdentity, sessionCookieName } from "../backend/auth";

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-auth-test-"));

try {
  initializeDatabaseStorage({ sqlitePath: path.join(temporaryDirectory, "taisto.sqlite") });
  assert.strictEqual(countUsers(), 0);

  const first = createUser({ username: "first-admin", password: "test-password-1", role: "user" });
  assert.strictEqual(first.role, "admin", "the first database user must always be an admin");
  assert.strictEqual(authenticateUser("FIRST-ADMIN", "test-password-1").id, first.id);
  assert.strictEqual(authenticateUser("first-admin", "wrong-password"), null);
  const loggedIn = recordUserLogin(first.id, "127.0.0.1");
  assert.strictEqual(loggedIn.loginCount, 1);
  assert.strictEqual(loggedIn.lastLoginIp, "127.0.0.1");
  assert.ok(loggedIn.lastLoginAt);
  const token = createSessionToken(Object.assign({}, first, { source: "database" }));
  const socketIdentity = getSessionIdentity({ headers: { cookie: `${sessionCookieName}=${token}` } });
  assert.strictEqual(socketIdentity.username, "first-admin", "Socket.IO request cookies must resolve to the signed-in user");

  const regular = createUser({ username: "operator", password: "test-password-2", role: "user" });
  assert.strictEqual(regular.role, "user");
  updateUser(regular.id, { role: "admin", password: "replacement-password" });
  assert.strictEqual(authenticateUser("operator", "replacement-password").role, "admin");

  updateUser(first.id, { role: "user" });
  assert.throws(() => updateUser(regular.id, { role: "user" }), /last admin/i);
  assert.throws(() => deleteUser(regular.id), /last admin/i);
  assert.strictEqual(listUsers().length, 2);

  const demotedWithEnvironmentFallback = updateUser(regular.id, { role: "user" }, { allowNoAdmin: true });
  assert.strictEqual(demotedWithEnvironmentFallback.role, "user", "an environment admin credential may replace the last database admin");
  assert.strictEqual(countAdminUsers(), 0);

  const replacementAdmin = updateUser(first.id, { role: "admin" });
  assert.strictEqual(replacementAdmin.role, "admin");
  assert.strictEqual(deleteUser(first.id, { allowNoAdmin: true }), true);
  assert.strictEqual(countAdminUsers(), 0);
  assert.strictEqual(listUsers().length, 1);
  assert.strictEqual(getAuthSessionSecret(), getAuthSessionSecret(), "session secret must be persistent");
  console.log("Authentication storage tests passed");
} finally {
  closeDatabaseStorage();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
