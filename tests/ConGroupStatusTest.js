import assert from "assert";
import { buildConGroupStatus } from "../backend/rest/conGroupStatus";

const group = {
  id: 7,
  slug: "Test group",
  conPorts: [
    { id: 11, slug: "Output 1", portNum: 1 },
    { id: 12, slug: "Output 2", portNum: 2 }
  ]
};
const cpuPort = { id: 21, slug: "Input 1", portNum: 1 };
const cpuPorts = {
  21: cpuPort,
  22: { id: 22, slug: "Input 2", portNum: 2 }
};
const getCpuPort = id => cpuPorts[id];

const active = buildConGroupStatus(group, cpuPort, () => 21, getCpuPort);
assert.strictEqual(active.active, true);
assert.strictEqual(active.status, "active");
assert.strictEqual(active.currentInputStatus, "single");
assert.strictEqual(active.currentCpuPort.slug, "Input 1");
assert.ok(active.outputs.every(output => output.active));

const partial = buildConGroupStatus(group, cpuPort, conPortId => conPortId === 11 ? 21 : 22, getCpuPort);
assert.strictEqual(partial.active, false);
assert.strictEqual(partial.status, "inactive");
assert.strictEqual(partial.currentInputStatus, "mixed");
assert.strictEqual(partial.currentCpuPort, null);
assert.strictEqual(partial.outputs.filter(output => output.active).length, 1);

const unknown = buildConGroupStatus(group, cpuPort, () => undefined);
assert.strictEqual(unknown.active, false);
assert.strictEqual(unknown.currentInputStatus, "unknown");
assert.ok(unknown.outputs.every(output => output.cpuPortId === null));

const empty = buildConGroupStatus({ id: 8, slug: "Empty", conPorts: [] }, cpuPort, () => 21);
assert.strictEqual(empty.active, false);

console.log("output group status tests passed");
