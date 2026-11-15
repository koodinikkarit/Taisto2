import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import net from "net";
import { spawn } from "child_process";

async function run() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-security-integration-"));
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const server = spawn(process.execPath, ["-r", "@babel/register", "app.js", "-p", String(port)], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, NODE_ENV: "production", TAISTO_PASSWORD: "integration-password", TAISTO_USER: "testadmin", TAISTO_DATABASE_PATH: path.join(directory, "test.sqlite"), TAISTO_JSON_DATABASE_PATH: path.join(directory, "missing.json") },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  server.stdout.on("data", data => { output += data; });
  server.stderr.on("data", data => { output += data; });
  const base = `http://127.0.0.1:${port}`;
  try {
    const deadline = Date.now() + 15000;
    let ready = false;
    while (Date.now() < deadline && server.exitCode === null) {
      try { await fetch(`${base}/auth/status`); ready = true; break; } catch (_) { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    if (!ready) throw new Error(`Test server failed to start: ${output}`);
    const attack = 'mutation { ...F } fragment F on MutationType { removeMatrix(id: "1") }';
    const response = await fetch(`${base}/api`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: attack }) });
    assert.strictEqual(response.status, 401, "fragment must not bypass admin authorization");
    const login = await fetch(`${base}/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "username=testadmin&password=integration-password", redirect: "manual" });
    assert.strictEqual(login.status, 302);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.strictEqual((await (await fetch(`${base}/auth/status`, { headers: { cookie } })).json()).authenticated, true);
    await fetch(`${base}/logout`, { method: "POST", headers: { cookie }, redirect: "manual" });
    assert.strictEqual((await (await fetch(`${base}/auth/status`, { headers: { cookie } })).json()).authenticated, false, "logout invalidates a copied cookie");
    const secondLogin = await fetch(`${base}/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "username=testadmin&password=integration-password", redirect: "manual" });
    const envCookie = secondLogin.headers.get("set-cookie").split(";")[0];
    const created = await fetch(`${base}/settings/users/data`, { method: "POST", headers: { "content-type": "application/json", cookie: envCookie }, body: JSON.stringify({ username: "dbadmin", password: "database-password", role: "admin" }) });
    assert.strictEqual(created.status, 201);
    const user = await created.json();
    const dbLogin = await fetch(`${base}/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "username=dbadmin&password=database-password", redirect: "manual" });
    assert.strictEqual(dbLogin.status, 302, "database login uses asynchronous password checking");
    const dbCookie = dbLogin.headers.get("set-cookie").split(";")[0];
    const basic = Buffer.from("dbadmin:database-password").toString("base64");
    const basicResponse = await fetch(`${base}/settings/users/data`, { headers: { authorization: `Basic ${basic}` } });
    assert.strictEqual(basicResponse.status, 200, "Basic authentication remains usable");
    const uppercaseUpdate = await fetch(`${base}/SETTINGS/users/data/${user.id}`, { method: "PATCH", headers: { "content-type": "application/json", cookie: dbCookie }, body: JSON.stringify({ role: "admin" }) });
    assert.strictEqual(uppercaseUpdate.status, 200);
    const audit = await (await fetch(`${base}/settings/audit-logs/data`, { headers: { cookie: dbCookie } })).json();
    assert.ok(audit.rows.some(row => row.action === "user.update" && row.path.startsWith("/SETTINGS/")), "case variants must be audited");
    const change = await fetch(`${base}/settings/users/data/${user.id}`, { method: "PATCH", headers: { "content-type": "application/json", cookie: dbCookie }, body: JSON.stringify({ password: "replacement-password" }) });
    assert.strictEqual(change.status, 200);
    assert.strictEqual((await (await fetch(`${base}/auth/status`, { headers: { cookie: dbCookie } })).json()).authenticated, false, "password change invalidates existing sessions");
    let rejected = false;
    for (let i = 0; i < 21; i++) {
      const attempt = await fetch(`${base}/LOGIN/`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "username=dbadmin&password=incorrect", redirect: "manual" });
      assert.ok(attempt.status === 401 || attempt.status === 429);
      if (attempt.status === 429) { rejected = true; break; }
    }
    assert.ok(rejected, "alternate login paths must be throttled");
    console.log("Security integration tests passed");
  } finally {
    server.kill();
    if (server.exitCode === null) await new Promise(resolve => server.once("exit", resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
