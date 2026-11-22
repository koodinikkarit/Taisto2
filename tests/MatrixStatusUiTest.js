import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { applyMiddleware, createStore } from "redux";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import createSocket from "../js/socket";
import reducer from "../js/reducers/Matrix";
import MatrixConnectionStatus from "../js/components/MatrixConnectionStatus";

const socket = new EventEmitter();
const store = createStore(reducer, applyMiddleware(createSocket((...args) => {
  assert.deepEqual(args, [], "use the same origin, including HTTPS and tunneled ports");
  return socket;
})));
const label = id => renderToStaticMarkup(<MatrixConnectionStatus
  code={store.getState().connectionStates.get(id)} t={key => key} />);
assert.match(label("1"), /matrixConnectionUnknown/);

socket.emit("MATRIX_CONNECTION_STATES", { 1: "CONNECTED", 2: "CONNECTING", 3: "DISCONNECTED" });
assert.match(label("1"), />connected</);
assert.match(label("2"), />matrixConnectionConnecting</);
assert.match(label("3"), />disconnected</);
socket.emit("MATRIX_CONNECTION_STATE_CHANGED", "ADDRESS_NOT_FOUND", 2);
assert.match(label("2"), />invalidAddress</);
socket.emit("MATRIX_CONNECTION_STATE_CHANGED", "DISCONNECTED", "1");
assert.match(label("1"), />disconnected</);
socket.emit("MATRIX_CONNECTION_STATE_CHANGED", "CONNECTED", "1");
assert.match(label("1"), />connected</);

// While this browser is offline matrix 2 recovers and matrix 3 is removed.
socket.emit("disconnect", "transport close");
assert.match(label("1"), /matrixConnectionUnknown/);
socket.emit("connect");
assert.match(label("1"), /matrixConnectionUnknown/, "transport recovery is not hardware recovery");
socket.emit("MATRIX_CONNECTION_STATES", { 1: "DISCONNECTED", 2: "CONNECTED" });
assert.match(label("1"), />disconnected</);
assert.match(label("2"), />connected</);
assert.match(label("3"), /matrixConnectionUnknown/);
socket.emit("MATRIX_CONNECTION_STATES", { 2: "CONNECTED" });
assert.equal(store.getState().connectionStates.has("1"), false, "replace, do not merge previous snapshot");
console.log("Matrix status UI snapshot, live update and reconnect tests passed");
