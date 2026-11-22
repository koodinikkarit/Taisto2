import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { applyMiddleware, createStore } from "redux";
import createSocket from "../js/socket";
import reducer from "../js/reducers/Matrix";

// Use the same browser client served at /socket.io/socket.io.js (Node 24 supplies WebSocket).
const io = require(path.join(path.dirname(require.resolve("socket.io/package.json")), "client-dist/socket.io.js"));
const listen = server => new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => resolve(server.address().port));
});
const close = server => new Promise(resolve => server.close(resolve));
async function until(condition, description) {
  for (const end = Date.now() + 15000; Date.now() < end; await delay(20)) {
    if (condition()) return;
  }
  throw new Error(`Timed out: ${description}`);
}

async function run() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-matrix-status-"));
  const servers = [], peers = [], clients = [];
  let child, output = "";
  async function router() {
    const sockets = [];
    const server = net.createServer(socket => {
      peers.push(socket);
      sockets.push(socket);
      socket.on("error", error => {
        if (error.code !== "ECONNRESET") throw error; // Expected on forced disconnect/shutdown.
      });
      socket.resume();
    });
    servers.push(server);
    return { sockets, port: await listen(server) };
  }
  try {
    const device = await router();
    const reservation = net.createServer();
    const appPort = await listen(reservation);
    await close(reservation);
    const base = `http://127.0.0.1:${appPort}`;
    const jsonPath = path.join(directory, "seed.json");
    fs.writeFileSync(jsonPath, JSON.stringify({ nextMatrixId: 2, matrixs: { "1": {
      id: 1, ip: "127.0.0.1", port: device.port, slug: "loopback", numberOfConPorts: 1, numberOfCpuPorts: 1
    } } }));
    child = spawn(process.execPath, ["-r", "@babel/register", "app.js", "-p", String(appPort)], {
      cwd: path.resolve(__dirname, ".."), stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production", TAISTO_USER: "testadmin", TAISTO_PASSWORD: "status-test-password",
        TAISTO_DATABASE_PATH: path.join(directory, "test.sqlite"), TAISTO_JSON_DATABASE_PATH: jsonPath }
    });
    child.stdout.on("data", data => { output += data; });
    child.stderr.on("data", data => { output += data; });
    await until(() => device.sockets.length === 1 && output.includes("serveri on käynnissä"), "isolated app and loopback router");

    function browser() {
      const client = io(base, { transports: ["websocket"], autoConnect: false, forceNew: true });
      clients.push(client);
      const snapshots = [];
      client.on("MATRIX_CONNECTION_STATES", states => snapshots.push(states));
      const store = createStore(reducer, applyMiddleware(createSocket(() => client)));
      client.connect();
      return { client, snapshots, state: () => store.getState().connectionStates.get("1") };
    }
    const first = browser();
    const second = browser();
    await until(() => [first, second].every(b => b.snapshots[0]?.["1"] === "CONNECTED" && b.state() === "CONNECTED"), "both initial snapshots");
    device.sockets[0].destroy();
    await until(() => [first, second].every(b => b.state() === "DISCONNECTED"), "live hardware disconnect");
    first.client.disconnect();
    assert.equal(first.state(), undefined, "a browser disconnect does not mean the hardware is down");
    await until(() => device.sockets.length === 2 && second.state() === "CONNECTED", "hardware reconnect without refresh or browser commands");
    first.client.connect();
    await until(() => first.snapshots[1]?.["1"] === "CONNECTED" && first.state() === "CONNECTED", "missed recovery restored by reconnect snapshot");
    const late = browser();
    await until(() => late.snapshots[0]?.["1"] === "CONNECTED" && late.state() === "CONNECTED", "new browser receives current status");

    const edit = async variables => {
      const response = await fetch(`${base}/api`, { method: "POST", headers: {
        "content-type": "application/json", authorization: "Basic " + Buffer.from("testadmin:status-test-password").toString("base64")
      }, body: JSON.stringify({ query: 'mutation($slug:String,$port:Int){editMatrix(id:"1",slug:$slug,port:$port){slug port}}', variables }) });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.errors, undefined, JSON.stringify(result.errors));
      return result.data.editMatrix;
    };
    assert.deepEqual(await edit({ slug: "new-name" }), { slug: "new-name", port: device.port });
    assert.equal(device.sockets.length, 2);
    assert.ok(!device.sockets[1].destroyed, "renaming must retain the existing TCP connection");
    const replacement = await router();
    const endpointEvents = [];
    second.client.on("MATRIX_CONNECTION_STATE_CHANGED", (state, id, ip, port) => endpointEvents.push([state, id, port]));
    assert.deepEqual(await edit({ port: replacement.port }), { slug: "new-name", port: replacement.port });
    await until(() => device.sockets[1].destroyed && replacement.sockets.length === 1 &&
      endpointEvents.some(([state, id, port]) => state === "CONNECTED" && id === "1" && port === replacement.port), "live endpoint change");
    assert.equal(second.state(), "CONNECTED");
    console.log("Matrix status integration passed: live loss/recovery, browser rejoin, late join and endpoint edit");
  } catch (error) {
    console.error(output);
    throw error;
  } finally {
    for (const client of clients) client.disconnect();
    if (child && child.exitCode === null && !child.signalCode) {
      const exited = new Promise(resolve => child.once("exit", resolve));
      child.kill();
      await exited;
    }
    for (const peer of peers) peer.destroy();
    await Promise.all(servers.map(close));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
