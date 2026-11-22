import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import net from 'node:net';
import test from 'node:test';
import Matrix from '../backend/records/Matrix';
import { REQUEST_ALL_STATES, SET_VIDEO_CONNECTION } from '../backend/records/MatrixCommands';

const flush = () => new Promise(resolve => setImmediate(resolve));
const videoFrame = Buffer.from([2, SET_VIDEO_CONNECTION, 129, 130, 3]);
const snapshotFrame = Buffer.from([2, REQUEST_ALL_STATES, 3]);
let nextId = 1;

function fixture(t, props = {}) {
  const matrix = new Matrix({ id: nextId++, ip: '127.0.0.1', port: 5555, numberOfConPorts: 2, numberOfCpuPorts: 2, ...props });
  const sockets = [];
  const states = [];
  matrix.on('MATRIX_CONNECTION_STATE_CHANGED', state => states.push(state));
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const OriginalSocket = net.Socket;
  net.Socket = class extends EventEmitter {
    writes = [];
    destroyed = false;
    writable = true;
    connect(port, ip, callback) {
      this.peer = { port, ip };
      this.connecting = true;
      if (callback) this.once('connect', callback);
      sockets.push(this);
      return this;
    }
    accept() { this.connecting = false; this.emit('connect'); }
    setKeepAlive() { return this; }
    write(bytes) { assert.ok(!this.destroyed); this.writes.push(Buffer.from(bytes)); return true; }
    destroy() { this.destroyed = true; this.writable = false; return this; }
    end() { return this.destroy(); }
    close() { this.destroy(); this.emit('close'); }
  };
  t.after(() => {
    try { matrix.destroy(); } finally { net.Socket = OriginalSocket; }
  });
  return { matrix, sockets, states };
}

test('concurrent commands and snapshot requests share one connection attempt', async t => {
  const { matrix, sockets } = fixture(t);
  matrix.requestAllStates();
  matrix.requestAllStates();
  matrix.setVideoConnection(1, 2);
  assert.equal(sockets.length, 1);
  sockets[0].accept();
  await flush();
  assert.equal(matrix.connectionState, 'CONNECTED');
  assert.equal(sockets[0].writes.filter(bytes => bytes.equals(snapshotFrame)).length, 1);
  assert.equal(sockets[0].writes.filter(bytes => bytes.equals(videoFrame)).length, 1);
});

test('an idle minute does not expire a healthy connection', async t => {
  const { matrix, sockets, states } = fixture(t);
  matrix.requestAllStates();
  sockets[0].accept();
  await flush();
  t.mock.timers.tick(65_000);
  matrix.requestAllStates();
  await flush();
  assert.equal(sockets.length, 1);
  assert.equal(sockets[0].writes.filter(bytes => bytes.equals(snapshotFrame)).length, 2);
  assert.equal(matrix.connectionState, 'CONNECTED');
  assert.ok(!states.includes('DISCONNECTED'));
});

test('a lost connection recovers and requests the full matrix state without page activity', async t => {
  const { matrix, sockets, states } = fixture(t);
  matrix.requestAllStates();
  const initial = sockets[0];
  initial.accept();
  await flush();
  initial.close();
  assert.equal(matrix.connectionState, 'DISCONNECTED');
  assert.equal(states.at(-1), 'DISCONNECTED');
  t.mock.timers.tick(1000);
  assert.equal(sockets.length, 2);
  const replacement = sockets[1];
  replacement.accept();
  await flush();
  assert.deepEqual(replacement.writes, [snapshotFrame]);
  assert.equal(matrix.connectionState, 'CONNECTED');
  assert.equal(states.at(-1), 'CONNECTED');
});

test('reconfiguring a connected matrix ignores late data and close from the old socket', async t => {
  const { matrix, sockets, states } = fixture(t);
  const routes = [];
  matrix.on('SET_VIDEO_CONNECTION', (...route) => routes.push(route));
  matrix.requestAllStates();
  const initial = sockets[0];
  initial.accept();
  await flush();
  const updated = matrix.set('port', 5556);
  updated.reconnect();
  assert.equal(sockets.length, 2);
  assert.equal(initial.destroyed, true);
  const replacement = sockets[1];
  assert.deepEqual(replacement.peer, { port: 5556, ip: '127.0.0.1' });
  replacement.accept();
  await flush();
  const before = states.slice();
  initial.emit('data', videoFrame);
  initial.emit('error', new Error('late error on old socket'));
  initial.emit('close');
  assert.deepEqual(states, before);
  assert.deepEqual(routes, []);
  assert.equal(updated.connectionState, 'CONNECTED');
  replacement.emit('data', videoFrame);
  assert.deepEqual(routes, [[1, 2]]);
  updated.destroy();
  replacement.emit('close');
  t.mock.timers.tick(120_000);
  assert.equal(sockets.length, 2);
});

test('failed switches are never replayed on reconnect and destruction cancels a pending retry', async t => {
  const { matrix, sockets } = fixture(t);
  matrix.setVideoConnection(1, 2);
  const initial = sockets[0];
  initial.emit('error', Object.assign(new Error('test connection refused'), { code: 'ECONNREFUSED' }));
  initial.close();
  await flush();
  matrix.setVideoConnection(2, 1); // Also discard any operation during retry backoff.
  assert.equal(sockets.length, 1);
  t.mock.timers.tick(1000);
  assert.equal(sockets.length, 2);
  sockets[1].accept();
  await flush();
  assert.deepEqual(sockets[1].writes, [snapshotFrame]);

  sockets[1].close();
  matrix.destroy();
  t.mock.timers.tick(120_000);
  assert.equal(sockets.length, 2);
});

test('a stalled connect times out after ten seconds and repeated retries are capped at thirty seconds', t => {
  const { matrix, sockets } = fixture(t);
  matrix.requestAllStates();
  for (const delay of [1000, 2000, 4000, 8000, 16_000, 30_000, 30_000]) {
    const count = sockets.length;
    const stalled = sockets.at(-1);
    t.mock.timers.tick(9999);
    assert.equal(stalled.destroyed, false);
    t.mock.timers.tick(1);
    assert.equal(stalled.destroyed, true);
    assert.equal(matrix.connectionState, 'DISCONNECTED');
    t.mock.timers.tick(delay - 1);
    assert.equal(sockets.length, count);
    t.mock.timers.tick(1);
    assert.equal(sockets.length, count + 1);
  }
  sockets.at(-1).accept();
  assert.equal(matrix.connectionState, 'CONNECTED');
});

test('DNS failure survives the following close and clears when a retry succeeds', async t => {
  const { matrix, sockets, states } = fixture(t, { ip: 'matrix.invalid' });
  matrix.requestAllStates();
  sockets[0].emit('error', Object.assign(new Error('test DNS failure'), { code: 'ENOTFOUND' }));
  assert.equal(matrix.connectionState, 'ADDRESS_NOT_FOUND');
  sockets[0].close();
  assert.equal(matrix.connectionState, 'ADDRESS_NOT_FOUND');
  assert.equal(states.at(-1), 'ADDRESS_NOT_FOUND');
  t.mock.timers.tick(1000);
  assert.equal(sockets.length, 2);
  sockets[1].accept();
  await flush();
  assert.equal(matrix.connectionState, 'CONNECTED');
  assert.equal(states.at(-1), 'CONNECTED');
  assert.deepEqual(sockets[1].writes, [snapshotFrame]);
});

test('a mock matrix reports connected without opening a TCP connection', async t => {
  const { matrix, sockets } = fixture(t, { mock: true });
  assert.equal(matrix.connectionState, 'CONNECTED');
  matrix.requestAllStates();
  t.mock.timers.tick(65_000);
  await flush();
  assert.equal(matrix.connectionState, 'CONNECTED');
  assert.deepEqual(sockets, []);
});
