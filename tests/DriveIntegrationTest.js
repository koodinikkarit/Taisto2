import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

async function main() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "taisto-drive-integration-"));
  const oauthPath = path.join(dir, "private-oauth.json"), keyPath = path.join(dir, "private-backup.key");
  const key = "0123456789abcdeffedcba9876543210", secret = "fake-private-client-secret";
  const folderId = "test-destination";
  let server, base;
  async function stop() {
    if (server && server.exitCode === null && server.signalCode === null) {
      const closed = once(server, "exit");
      server.kill();
      await closed;
    }
    server = null;
  }
  async function start(bootstrapPassword) {
    const socket = net.createServer();
    socket.listen(0, "127.0.0.1");
    await once(socket, "listening");
    const port = socket.address().port;
    await new Promise(resolve => socket.close(resolve));
    base = "http://127.0.0.1:" + port;
    const db = bootstrapPassword ? "taisto.sqlite" : "unconfigured.sqlite";
    server = spawn(process.execPath, ["-r", "./tests/fixtures/mock-drive.cjs", "-r", "@babel/register", "app.js", "-p", String(port)], {
      cwd: path.resolve(__dirname, ".."), stdio: "ignore",
      env: { ...process.env, NODE_ENV: "production", TAISTO_USER: "bootstrap", TAISTO_PASSWORD: bootstrapPassword,
        BACKUP_OAUTH_FILE: oauthPath, BACKUP_KEY_FILE: keyPath, TAISTO_DATABASE_PATH: path.join(dir, db),
        TAISTO_JSON_DATABASE_PATH: path.join(dir, bootstrapPassword ? "database.json" : "missing.json") }
    });
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && server.exitCode === null) {
      try { if ((await fetch(base + "/auth/status")).ok) return; } catch { /* not yet accepting connections */ }
      await delay(50);
    }
    throw Error("Temporary Taisto server did not start");
  }
  const hdr = cookie => ({ "content-type": "application/json", ...(cookie ? {cookie} : {}) });
  const call = (method, route, cookie, data) => fetch(base + route, { method, headers: hdr(cookie), redirect: "manual", body: data && JSON.stringify(data) });
  const setCookie = response => response.headers.get("set-cookie").split(";")[0];
  const login = async (username, password) => {
    const res = await fetch(base + "/login", { method: "POST", redirect: "manual", body: new URLSearchParams({username, password}) });
    assert.equal(res.status, 302);
    return setCookie(res);
  };
  const config = "/settings/drive-backup/config", run = "/settings/drive-backup/run";
  const assertPrivate = object => {
    const text = JSON.stringify(object);
    for (const value of [secret, key, "fake-private-refresh", "fake-private-access", oauthPath, keyPath]) assert.ok(!text.includes(value));
  };
  try {
    await fs.writeFile(oauthPath, JSON.stringify({client_id:"client",client_secret:secret,refresh_token:"fake-private-refresh"}), {mode:0o600});
    await fs.writeFile(keyPath, key, {mode:0o600});
    await fs.copyFile(path.join(__dirname, "fixtures", "mock-database.json"), path.join(dir, "database.json"));
    await start("");
    assert.equal((await call("GET", config)).status, 403);
    assert.equal((await call("POST", run, "", {})).status, 403, "no bootstrap credentials must not enable anonymous export");
    await stop();
    await start("bootstrap-password");
    for (const [method, route] of [["GET",config], ["PUT",config], ["POST",run]]) {
      assert.equal((await call(method, route, "", method === "GET" ? undefined : {})).status, 401);
    }
    const bootstrap = await login("bootstrap", "bootstrap-password");
    const create = (cookie, username, role) => call("POST", "/settings/users/data", cookie, {username, role, password: "integration-password"});
    const first = await create(bootstrap, "backup-admin", "admin");
    assert.equal(first.status, 201);
    const admin = setCookie(first);
    assert.equal((await create(admin, "backup-user", "user")).status, 201);
    const user = await login("backup-user", "integration-password");
    for (const [method, route] of [["GET",config], ["PUT",config], ["POST",run]]) {
      assert.equal((await call(method, route, user, method === "GET" ? undefined : {})).status, 403);
    }
    let res = await call("PUT", config, admin, { enabled: false, folderId });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    const saved = await res.json();
    assert.ok(saved.credentialsConfigured && saved.keyConfigured);
    assert.equal(saved.folderId, folderId);
    assertPrivate(saved);
    res = await fetch(base + run, {method:"POST",headers:{cookie:admin},body:"non-json"});
    assert.equal(res.status, 415);
    res = await call("POST", run, admin, {});
    assert.equal(res.status, 202);
    assert.deepEqual(await res.json(), {accepted:true});
    const deadline = Date.now() + 15000;
    let status;
    do {
      status = await (await call("GET", config, admin)).json();
      if (!status.running && status.lastAttemptAt) break;
      await delay(50);
    } while (Date.now() < deadline);
    assert.equal(status.running, false);
    assert.equal(status.lastError, "");
    assert.ok(status.lastSuccessAt);
    assert.match(status.lastFilename, /^taisto-.*\.sqlite\.enc$/);
    assertPrivate(status);
    const log = await (await call("GET", "/settings/audit-logs/data?action=drive_backup", admin)).json();
    for (const action of ["drive_backup.configure", "drive_backup.request", "drive_backup.result"]) {
      assert.ok(log.rows.some(row => row.action === action && row.actorName === "backup-admin" && row.success && /127\.0\.0\.1$/.test(row.ipAddress)), action);
    }
    assertPrivate(log);
    await stop();
    await start("bootstrap-password");
    const afterRestart = await (await call("GET", config, await login("backup-admin", "integration-password"))).json();
    assert.equal(afterRestart.lastSuccessAt, status.lastSuccessAt);
    assert.equal(afterRestart.lastFilename, status.lastFilename);
    assert.equal(afterRestart.folderId, folderId);
    console.log("Drive backup HTTP access, verified upload, audit and persistence tests passed");
  } finally { await stop(); await fs.rm(dir, {recursive:true, force:true}); }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
