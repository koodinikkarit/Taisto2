import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

async function waitForRouting(read, expected) {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline && JSON.stringify(read()) !== JSON.stringify(expected)) await delay(10);
  assert.deepEqual(read(), expected);
}

async function run() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-telegram-service-"));
  const storage = require("../backend/storage/SqliteStorage");
  try {
    // The service loads its database at import time. Only open a temporary
    // mock installation, never the caller's database or a hardware connection.
    process.env.TAISTO_DATABASE_PATH = path.join(directory, "test.sqlite");
    process.env.TAISTO_JSON_DATABASE_PATH = path.join(directory, "seed.json");
    process.env.TAISTO_PASSWORD = "test-only";
    const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "mock-database.json"), "utf8"));
    assert.ok(Object.values(fixture.matrixs).every(matrix => matrix.mock === true));
    fixture.matrixs[1].numberOfCpuPorts = 5;
    fixture.cpuPorts[45] = { id: 45, slug: "Test input", matrixId: 1, portNum: 5 };
    fixture.nextCpuPortId = 46;
    fixture.conGroups = {
      1: { id: 1, slug: "Restricted", matrixId: 1, conPortIds: [1, 2], useAllCpuPorts: false, cpuPortIds: [45] },
      2: { id: 2, slug: "All", matrixId: 1, conPortIds: [1, 2], useAllCpuPorts: true, cpuPortIds: [] }
    };
    fixture.nextConGroupId = 3;
    fs.writeFileSync(process.env.TAISTO_JSON_DATABASE_PATH, JSON.stringify(fixture));

    const { createTelegramService } = require("../backend/telegram/service");
    const { getVideoConnections } = require("../backend/TaistoService");
    const service = createTelegramService();
    assert.deepEqual(service.listMatrices(), [{ id: 1, name: "Demo-matriisi" }]);
    assert.deepEqual(service.listDefaultStates(), [{ id: 1, name: "Demo-perustila" }]);
    const groups = service.listGroups();
    const testInput = { id: 45, name: "5. Test input" };
    assert.deepEqual(groups.find(g => g.id === 1), { id: 1, name: "Restricted", inputs: [testInput] });
    const allInputs = groups.find(g => g.id === 2).inputs;
    assert.equal(allInputs.length, 5);
    assert.deepEqual(allInputs[4], testInput);

    const initial = { 1: "1", 2: "2", 3: "3", 4: "4" };
    assert.deepEqual(getVideoConnections(), initial);
    assert.equal(service.executeGroup(1, 3), false, "existing input outside the group's allowlist");
    assert.equal(service.executeGroup(1, 5), false, "port number is not the Telegram input ID");
    assert.equal(service.executeGroup(123, 45), false);
    assert.equal(service.executeGroup(1, 45), true);
    await waitForRouting(getVideoConnections, { ...initial, 1: "45", 2: "45" });
    assert.equal(service.executeGroup(2, 3), true, "unrestricted groups accept other inputs");
    await waitForRouting(getVideoConnections, { ...initial, 1: "3", 2: "3" });
    assert.equal(service.executeDefaultState(123), false);
    assert.equal(service.executeDefaultState(1), true);
    await waitForRouting(getVideoConnections, initial);
    console.log("Telegram service mock routing tests passed");
  } finally {
    storage.closeDatabaseStorage();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
