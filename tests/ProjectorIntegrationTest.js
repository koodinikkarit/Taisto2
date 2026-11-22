import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const listen = async server => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
};
const close = server => new Promise(resolve => server.close(resolve));

async function run() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "taisto-projector-http-"));
  const requests = [];
  const device = http.createServer(async (req, res) => {
    let body = "";
    for await (const part of req) body += part;
    requests.push({ method: req.method, path: req.url, body: JSON.parse(body) });
    const check = requests.at(-1).body.req.type === "get";
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(check ? { current_power_is_on: false, current_input: "input2", label: { input2: "Demo HDMI" } } : {}));
  });
  let child, base, logs = "";
  async function start(password) {
    const reservation = net.createServer();
    const port = await listen(reservation);
    await close(reservation);
    base = "http://127.0.0.1:" + port;
    child = spawn(process.execPath, ["-r", "@babel/register", "app.js", "-p", String(port)], {
      cwd: path.resolve(__dirname, ".."), stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production", TAISTO_USER: "operator-admin", TAISTO_PASSWORD: password,
        TAISTO_JSON_DATABASE_PATH: path.join(dir, "missing.json"), TAISTO_DATABASE_PATH: path.join(dir, "test.sqlite") }
    });
    child.stdout.on("data", b => { logs += b; });
    child.stderr.on("data", b => { logs += b; });
    for (const end = Date.now() + 15000; Date.now() < end && child.exitCode === null; await delay(40)) {
      try { if ((await fetch(base + "/auth/status")).ok) return; } catch { /* starting */ }
    }
    throw new Error("Test app did not start: " + logs);
  }
  async function stop() {
    if (child && child.exitCode === null && !child.signalCode) {
      const exited = once(child, "exit"); child.kill(); await exited;
    }
    child = null;
  }
  const config = "/settings/projector/config", status = "/projector/status", command = "/projector/command";
  const call = (method, route, cookie, data) => fetch(base + route, {
    method, redirect: "manual", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: data === undefined ? undefined : JSON.stringify(data)
  });
  const cookieOf = res => res.headers.get("set-cookie").split(";")[0];
  async function login(username, password) {
    const res = await fetch(base + "/login", { method: "POST", redirect: "manual",
      body: new URLSearchParams({ username, password, next: "/projector" }) });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "/projector");
    return cookieOf(res);
  }
  try {
    const port = await listen(device);
    await start("");
    for (const route of [config, status, "/projector"]) assert.equal((await call("GET", route)).status, 403);
    assert.equal((await call("POST", command, "", { command: "power_toggle" })).status, 403);
    await stop();
    await start("bootstrap-pass");
    for (const route of [config, status]) assert.equal((await call("GET", route)).status, 401);
    assert.equal((await call("GET", "/projector")).status, 302);
    const bootstrap = await login("operator-admin", "bootstrap-pass");
    const create = (cookie, username, role) => call("POST", "/settings/users/data", cookie, { username, password: "example-pass", role });
    const first = await create(bootstrap, "admin", "admin");
    assert.equal(first.status, 201);
    const admin = cookieOf(first);
    assert.equal((await create(admin, "operator", "user")).status, 201);
    const user = await login("operator", "example-pass");
    const settings = await (await call("GET", config, admin)).json();
    assert.equal(settings.enabled, false);
    assert.equal((await (await call("GET", status, user)).json()).enabled, false);
    assert.equal((await call("POST", command, user, {command: "freeze"})).status, 409);
    assert.equal((await call("GET", config, user)).status, 403);
    const next = {...settings, enabled: true, host: "127.0.0.1", port, path: "/cgi-bin/web.cgi"};
    assert.equal((await call("PUT", config, user, next)).status, 403);
    assert.equal((await call("PUT", config, admin, next)).status, 200);
    assert.equal(requests.length, 0, "saving settings must not operate the device");

    const feedback = await call("GET", status, user);
    assert.equal(feedback.status, 200);
    assert.equal(feedback.headers.get("cache-control"), "no-store");
    const state = await feedback.json();
    assert.equal(state.powerOn, false);
    assert.equal(state.currentInput, "input2");
    assert.equal(state.labels.input2, "Demo HDMI");
    assert.equal(state.host, undefined);
    assert.deepEqual(requests[0], {method:"POST", path:next.path, body:{req:{type:"get", category:"control", lang:"en"}}});
    assert.equal((await call("POST", command, "", {command:"input_b"})).status, 401);
    assert.equal((await fetch(base + command, {method:"POST",headers:{cookie:user},body:new URLSearchParams({command:"freeze"})})).status, 415);
    assert.equal((await call("POST", command, user, {command:"freeze", host:"unused"})).status, 400);
    assert.equal((await call("POST", command, user, {command:"not_a_preset"})).status, 400);
    const sent = await call("POST", command, user, {command:"input_b"});
    assert.equal(sent.status, 200);
    assert.equal((await sent.json()).accepted, true);
    assert.equal((await call("POST", command, user, {command:"input_a"})).status, 429);
    assert.deepEqual(requests.filter(r => r.body.req.type === "send"), [
      { method:"POST", path:next.path, body:{req:{type:"send",category:"control"},param:{category:"4054",code:"2C"}} }
    ]);
    const audit = await (await call("GET", "/settings/audit-logs/data?action=projector", admin)).json();
    assert.ok(audit.rows.some(r => r.action === "projector.configure" && r.actorName === "admin" && r.success));
    assert.ok(audit.rows.some(r => r.action === "projector.command" && r.actorName === "operator" && r.success
      && r.details.body.command === "input_b" && /127\.0\.0\.1$/.test(r.ipAddress)));
    console.log("Projector HTTP integration passed: admin setup, operator controls, device feedback, cooldown and audit");
  } finally {
    await stop();
    await close(device);
    await fs.rm(dir, {recursive:true, force:true});
  }
}
run().catch(err => { console.error(err); process.exitCode = 1; });
