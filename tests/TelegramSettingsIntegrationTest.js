import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import net from "net";
import { spawn, execFileSync } from "child_process";

async function run() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-telegram-integration-"));
  const sqlitePath = path.join(directory, "database.sqlite");
  const jsonPath = path.join(directory, "database.json");
  fs.copyFileSync(path.resolve(__dirname, "fixtures", "mock-database.json"), jsonPath);
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const server = spawn(process.execPath, ["-r", "./tests/fixtures/capture-telegram.cjs", "-r", "@babel/register", "app.js", "-p", String(port)], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, NODE_ENV: "production", TAISTO_PASSWORD: "integration-password", TAISTO_USER: "testadmin", TAISTO_DATABASE_PATH: sqlitePath, TAISTO_JSON_DATABASE_PATH: jsonPath },
    stdio: ["ignore", "pipe", "pipe", "ipc"]
  });
  const notices = [];
  server.on("message", message => notices.push(message));
  let output = "";
  server.stdout.on("data", data => { output += data; });
  server.stderr.on("data", data => { output += data; });
  const base = `http://127.0.0.1:${port}`;
  const token = "987654321:abcdefghijklmnopqrstuvwxyz_0123456789";
  const settings = { enabled: false, token, allowedUserIds: "123, 456", auditEnabled: false, auditChatId: "" };
  try {
    const deadline = Date.now() + 15000;
    let ready = false;
    while (Date.now() < deadline && server.exitCode === null) {
      try { await fetch(`${base}/auth/status`); ready = true; break; } catch (_) { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    if (!ready) throw new Error(`Test server failed to start: ${output}`);
    const headers = { "content-type": "application/json", accept: "application/json" };
    const page = await fetch(`${base}/settings/telegram`, { redirect: "manual" });
    assert.strictEqual(page.status, 302, "navigating to the settings page still redirects to sign-in");
    for (const endpoint of ["config", "status"]) {
      const anonymous = await fetch(`${base}/settings/telegram/${endpoint}`, { redirect: "manual" });
      assert.strictEqual(anonymous.status, 401, "a missing session returns an error rather than the sign-in page");
      assert.ok((await anonymous.json()).error.message);
    }
    const anonymousWrite = await fetch(`${base}/settings/telegram/config`, { method: "PUT", headers, body: JSON.stringify(settings), redirect: "manual" });
    assert.strictEqual(anonymousWrite.status, 401, "anonymous users cannot write settings");
    const login = await fetch(`${base}/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "username=testadmin&password=integration-password", redirect: "manual" });
    const environmentCookie = login.headers.get("set-cookie").split(";")[0];
    const adminCreate = await fetch(`${base}/settings/users/data`, { method: "POST", headers: { ...headers, cookie: environmentCookie }, body: JSON.stringify({ username: "dbadmin", password: "database-password", role: "admin" }) });
    assert.strictEqual(adminCreate.status, 201);
    const adminCookie = adminCreate.headers.get("set-cookie").split(";")[0];
    const operatorCreate = await fetch(`${base}/settings/users/data`, { method: "POST", headers: { ...headers, cookie: adminCookie }, body: JSON.stringify({ username: "operator", password: "operator-password", role: "user" }) });
    assert.strictEqual(operatorCreate.status, 201);
    const operatorLogin = await fetch(`${base}/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "username=operator&password=operator-password", redirect: "manual" });
    const operatorCookie = operatorLogin.headers.get("set-cookie").split(";")[0];
    for (const method of ["GET", "PUT"]) {
      const response = await fetch(`${base}/settings/telegram/config`, { method, headers: { "content-type": "application/json", cookie: operatorCookie }, ...(method === "PUT" ? { body: JSON.stringify(settings) } : {}), redirect: "manual" });
      assert.strictEqual(response.status, 403, "ordinary users cannot manage Telegram settings");
      assert.ok((await response.json()).error.message);
    }
    const adminHeaders = { ...headers, cookie: adminCookie, "x-forwarded-for": "192.0.2.99" };
    const put = changes => fetch(`${base}/settings/telegram/config`, { method: "PUT", headers: adminHeaders, body: JSON.stringify({ ...settings, ...changes }) });
    const names = { "123": "Ohjaamo", "456": "Aula" };
    const saved = await put({ allowedUserNames: names });
    assert.strictEqual(saved.status, 200);
    const savedConfig = await saved.json();
    assert.ok(!JSON.stringify(savedConfig).includes(token), "PUT response must not expose token");
    assert.deepStrictEqual(savedConfig.allowedUserNames, names);
    const publicConfig = await (await fetch(`${base}/settings/telegram/config`, { headers: adminHeaders })).text();
    assert.ok(!publicConfig.includes(token), "GET response must not expose token");
    assert.strictEqual(JSON.parse(publicConfig).tokenConfigured, true);
    assert.deepStrictEqual(JSON.parse(publicConfig).allowedUserNames, names, "the admin settings page can display the saved names");
    const status = await (await fetch(`${base}/settings/telegram/status`, { headers: adminHeaders })).text();
    assert.strictEqual(JSON.parse(status).state, "disabled");
    assert.ok(!status.includes(token), "status must not expose token");
    const renamed = await put({ token: "", allowedUserNames: { ...names, "123": "Uusi nimi" } });
    assert.strictEqual(renamed.status, 200);
    const renamedConfig = await renamed.json();
    assert.deepStrictEqual(renamedConfig.allowedUserNames, { ...names, "123": "Uusi nimi" });
    assert.strictEqual(renamedConfig.allowedUserIds, savedConfig.allowedUserIds);
    assert.strictEqual(renamedConfig.tokenConfigured, true);
    for (const invalid of [{ token: "bad" }, { allowedUserIds: "abc" }, { auditEnabled: true, auditChatId: "" }]) {
      assert.strictEqual((await put(invalid)).status, 400, "invalid input must be rejected");
    }
    const audit = await (await fetch(`${base}/settings/audit-logs/data`, { headers: adminHeaders })).text();
    const rows = JSON.parse(audit).rows;
    const changes = rows.filter(row => row.action === "telegram.settings_update");
    const adminChange = changes.find(row => row.success && row.actorType === "user" && row.actorName === "dbadmin");
    assert.ok(adminChange && adminChange.actorId, "the audit page receives the signed-in administrator's identity");
    const isClientIp = row => /^(?:::ffff:)?127\.0\.0\.1$/.test(row.ipAddress);
    assert.ok(changes.every(isClientIp), "the UI receives the TCP peer IP, even when a caller supplies a forwarded IP");
    assert.ok(rows.some(row => row.action === "authentication.login" && row.actorName === "operator" && isClientIp(row)),
      "the login row also contains the verified user and source IP");
    assert.ok(changes.some(row => !row.success && row.statusCode === 401 && row.actorType === "unauthenticated"), "rejected anonymous write must not be logged as successful");
    assert.ok(changes.some(row => !row.success && row.statusCode === 403 && row.actorName === "operator"), "the rejected operator write records the correct actor");
    assert.ok(!audit.includes(token), "audit log must not contain token");

    // Send an actual HTTP change using the administrator's session. Only the
    // outbound Telegram transport is mocked; the server, auth and SQLite are real.
    const chatId = "-9001";
    assert.strictEqual((await put({ auditEnabled: true, auditChatId: chatId })).status, 200);
    const operator = await operatorCreate.json();
    const patch = await fetch(`${base}/settings/users/data/${operator.id}`, {
      method: "PATCH", headers: adminHeaders, body: JSON.stringify({ username: "renamed-operator" })
    });
    assert.strictEqual(patch.status, 200);
    const auditRows = await (await fetch(`${base}/settings/audit-logs/data?action=user.update`, { headers: adminHeaders })).json();
    const row = auditRows.rows.find(entry => entry.action === "user.update" && entry.success);
    assert.ok(row && row.actorName === "dbadmin" && isClientIp(row), "record the caller, not the edited user");
    const expected = `user.update · onnistui · Käyttäjä: ${row.actorName} · IP: ${row.ipAddress}`;
    const delivered = () => notices.some(note => note.chat_id === chatId && note.text.split("\n").includes(expected));
    const sendDeadline = Date.now() + 10000;
    while (!delivered() && Date.now() < sendDeadline) await new Promise(resolve => setTimeout(resolve, 50));
    assert.ok(delivered(), "Telegram should receive the same signed-in user and source IP as the audit page");

    const backupPath = path.join(directory, "export.json");
    execFileSync(process.execPath, ["-r", "@babel/register", "scripts/export-sqlite-to-json.js", "--sqlite", sqlitePath, "--output", backupPath], { cwd: path.resolve(__dirname, ".."), stdio: "pipe" });
    assert.ok(!fs.readFileSync(backupPath, "utf8").includes(token), "JSON export must omit Telegram token");
    console.log("Telegram settings integration tests passed");
  } finally {
    server.kill();
    if (server.exitCode === null) await new Promise(resolve => server.once("exit", resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
