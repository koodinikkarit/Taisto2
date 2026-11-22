import assert from "assert";
import { EventEmitter } from "events";
import { registerSocketHandlers, syncMatrixClient } from "../backend/socketHandlers";
import { MATRIX_CONNECTION_STATES } from "../js/constants/matrix";
import { SET_VIDEO_CONNECTION, SET_KWM_CONNECTION, TURN_OFF_VIDEO_CONNECTION, TURN_OFF_KWM_CONNECTION } from "../js/constants/actionconstants";

const socket = new EventEmitter();
const calls = [];
const audits = [];
const database = {
  conPorts: new Map([[1, { setValue: id => calls.push(["video", id]), turnOffPort: () => calls.push(["video-off"]) }]]),
  cpuPorts: new Map([[2, { setValue: id => calls.push(["kvm", id]), turnOffPort: () => calls.push(["kvm-off"]) }]]),
  matrixs: new Map([[3, { requestAllStates: () => calls.push(["refresh"]) }]])
};
registerSocketHandlers(socket, () => database, (...args) => audits.push(args));

for (const value of [undefined, null, false, [], {}, { con: null, cpu: "2" }, { con: "1garbage", cpu: "2" }, { con: "1", cpu: {} }, { con: [], cpu: "2" }]) {
  assert.doesNotThrow(() => socket.emit(SET_VIDEO_CONNECTION, value));
  assert.doesNotThrow(() => socket.emit(SET_KWM_CONNECTION, value));
}
for (const value of [undefined, null, {}, [], "1garbage", -1, 1.5]) {
  assert.doesNotThrow(() => socket.emit(TURN_OFF_VIDEO_CONNECTION, value));
  assert.doesNotThrow(() => socket.emit(TURN_OFF_KWM_CONNECTION, value));
  assert.doesNotThrow(() => socket.emit("REQUEST_ALL_STATES", value));
}
assert.deepStrictEqual(calls, []);
assert.ok(audits.every(args => args[4] === false));

socket.emit(SET_VIDEO_CONNECTION, { con: "1", cpu: 2 });
socket.emit(SET_KWM_CONNECTION, { con: 1, cpu: "2" });
socket.emit(TURN_OFF_VIDEO_CONNECTION, "1");
socket.emit(TURN_OFF_KWM_CONNECTION, 2);
socket.emit("REQUEST_ALL_STATES", "3");
assert.deepStrictEqual(calls, [["video", 2], ["kvm", 1], ["video-off"], ["kvm-off"], ["refresh"]]);
assert.ok(audits.slice(-4).every(args => args[4] === true));

const emitted = [];
const joiningClient = { emit: (...args) => emitted.push(args) };
const devices = new Map([
  [3, { id: 3, connectionState: "CONNECTED", requestAllStates: () => emitted.push(["refresh", 3]) }],
  [4, { id: 4, connectionState: "DISCONNECTED", requestAllStates: () => emitted.push(["refresh", 4]) }]
]);
syncMatrixClient(joiningClient, devices);
assert.deepStrictEqual(emitted.splice(0), [
  [MATRIX_CONNECTION_STATES, { "3": "CONNECTED", "4": "DISCONNECTED" }], ["refresh", 3], ["refresh", 4]
]);
devices.delete(3);
devices.get(4).connectionState = "CONNECTED";
syncMatrixClient(joiningClient, devices);
assert.deepStrictEqual(emitted.splice(0), [[MATRIX_CONNECTION_STATES, { "4": "CONNECTED" }], ["refresh", 4]]);
syncMatrixClient(joiningClient, new Map());
assert.deepStrictEqual(emitted, [[MATRIX_CONNECTION_STATES, {}]]);
console.log("Socket.IO handler validation tests passed");
