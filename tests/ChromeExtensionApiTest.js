import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import net from "net";
import { spawn } from "child_process";

async function run() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-extension-api-"));
  fs.copyFileSync(path.resolve("tests/fixtures/mock-database.json"), path.join(directory, "database.json"));
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const child = spawn(process.execPath, ["-r", "@babel/register", "app.js", "-p", String(port)], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, NODE_ENV: "production", TAISTO_USER: "testadmin", TAISTO_PASSWORD: "extension-test-password", TAISTO_DATABASE_PATH: path.join(directory, "test.sqlite"), TAISTO_JSON_DATABASE_PATH: path.join(directory, "database.json") },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", data => { output += data; });
  child.stderr.on("data", data => { output += data; });
  const base = `http://127.0.0.1:${port}`;
  try {
    const deadline = Date.now() + 15000;
    let ready = false;
    while (Date.now() < deadline && child.exitCode === null) {
      try { await fetch(`${base}/auth/status`); ready = true; break; } catch (_) { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    if (!ready) throw new Error(`Test server failed to start: ${output}`);
    const login = await fetch(`${base}/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "username=testadmin&password=extension-test-password", redirect: "manual" });
    assert.strictEqual(login.status, 302);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const keyResponse = await fetch(`${base}/settings/api-key/config`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ name: "extension-test", expiresInDays: 1 }) });
    assert.strictEqual(keyResponse.status, 201);
    const { key } = await keyResponse.json();
    assert.ok(key);
    const diagrams = await (await fetch(`${base}/rest/diagrams`)).json();
    const screen = diagrams[0].diagramScreens[0];
    assert.strictEqual(diagrams[0].slug, "Demo-sali");
    assert.strictEqual(screen.conPort.id, "1");
    assert.deepStrictEqual(screen.cpuPorts.map(port => port.id).sort(), ["1", "3"]);
    const resource = `${base}/rest/con-ports/${screen.conPort.id}/video-connection`;
    const initial = await (await fetch(resource)).json();
    assert.strictEqual(initial.cpuPort.id, "1");
    const unauthorized = await fetch(resource, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cpuPort: "3" }) });
    assert.strictEqual(unauthorized.status, 401);
    const switched = await fetch(resource, { method: "POST", headers: { "content-type": "application/json", "x-api-key": key }, body: JSON.stringify({ cpuPort: "3" }) });
    assert.strictEqual(switched.status, 201);
    const updated = await (await fetch(resource)).json();
    assert.strictEqual(updated.cpuPort.id, "3", "mock matrix reports the newly selected input");
    console.log("Chrome extension Taisto API integration tests passed");
  } finally {
    child.kill();
    if (child.exitCode === null) await new Promise(resolve => child.once("exit", resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
