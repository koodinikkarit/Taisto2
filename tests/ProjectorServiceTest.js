import assert from "node:assert/strict";
import test from "node:test";
import { createProjectorService } from "../backend/projector/service";

function fixture(reply = () => Response.json({ current_power_is_on: true, current_input: "input1" }), extra = {}) {
  let config, clock = 0;
  const calls = [];
  const service = createProjectorService({
    getConfig: () => config,
    saveConfig: value => { config = value; },
    fetchImpl: async (url, init) => {
      assert.equal(init.method, "POST");
      assert.equal(init.redirect, "error");
      assert.equal(init.headers["Content-Type"], "application/json");
      assert.ok(init.signal instanceof AbortSignal);
      const call = { url, body: JSON.parse(init.body) };
      calls.push(call);
      return reply(call, init);
    },
    now: () => clock,
    ...extra
  });
  const enable = (props = {}) => service.configure({ ...service.getSettings(), host: "projector.local", enabled: true, ...props });
  return { service, calls, enable, tick: (ms = 2000) => { clock += ms; } };
}
const failure = status => error => error.status === status;

test("disabled until configured; saves validated admin settings without contacting a projector", async () => {
  const { service, enable, calls } = fixture();
  assert.deepEqual(service.getSettings(), { enabled: false, host: "", port: 8001, path: "/cgi-bin/web.cgi",
    powerCategory: "4054", powerToggleCode: "15", powerOnCategory: "", powerOnCode: "", powerOffCategory: "", powerOffCode: "" });
  assert.deepEqual(await service.status(), { enabled: false, powerOn: null, currentInput: null, labels: {},
    canPowerOn: false, canPowerOff: false });
  await assert.rejects(service.command("power_toggle"), failure(409));
  for (const props of [{ host: "" }, { host: "http://example.org" }, { host: "user@host" }, { host: "host:80" },
    { host: "127.1" }, { host: "[::1]:80" }, { host: "bad_host" }, { host: "fe80::1%1" }, { port: 0 },
    { port: 65536 }, { port: "8001" }, { port: 1.5 }, { path: "//elsewhere.com/cgi" }, { path: "cgi" },
    { path: "/a?secret=1" }, { path: "/a#b" }, { path: "/../cgi" }, { path: "/%2e%2e/cgi" },
    { path: "/a\\b" }, { powerCategory: "bogus" }, { powerOnCode: "123" }, { powerOnCode: "15" },
    { powerOffCode: "15" }, { powerOnCode: "ab", powerOffCode: "AB" }]) {
    assert.throws(() => enable(props), failure(400), JSON.stringify(props));
  }
  assert.deepEqual(calls, []);
  const config = enable({ host: "[::1]", port: 1234, path: "/test/status.cgi", powerOffCode: "ab" });
  assert.equal(config.host, "::1");
  assert.equal(config.powerOffCode, "AB");
  assert.deepEqual(service.getSettings(), config);
  assert.equal((await service.status()).canPowerOff, true);
  assert.equal(calls[0].url, "http://[::1]:1234/test/status.cgi");
});

test("reads Companion wire status, bounds labels, and never mistakes missing power for off", async () => {
  let raw = { current_power_is_on: "0", current_input: "input2", label: { input2: " Demo-PC ", input4: 7, extra: "ignored" } };
  const { service, enable, calls } = fixture(() => Response.json(raw));
  enable();
  assert.deepEqual(await service.status(), { enabled: true, powerOn: false, currentInput: "input2",
    labels: { input2: "Demo-PC" }, canPowerOn: false, canPowerOff: false });
  assert.deepEqual(calls[0], { url: "http://projector.local:8001/cgi-bin/web.cgi", body: {
    req: { type: "get", category: "control", lang: "en" } } });
  raw = { current_input: null };
  assert.equal((await service.status()).powerOn, null);
  raw = { current_power_is_on: 1 };
  assert.equal((await service.status()).powerOn, true);
  raw = { secret: "raw upstream body" };
  await assert.rejects(service.status(), failure(502));
});

test("only Companion presets and explicitly configured discrete codes can be sent", async () => {
  const { service, enable, calls, tick } = fixture(() => new Response(null, { status: 204 }));
  enable();
  await assert.rejects(service.command("power_on"), failure(409));
  await assert.rejects(service.command({ category: "4054", code: "15", host: "other" }), failure(400));
  await assert.rejects(service.command("constructor"), failure(400));
  enable({ powerCategory: "4054", powerOnCode: "2e", powerOffCode: "2f" });
  for (const [id, category, code] of [
    ["power_toggle", "4054", "15"], ["freeze", "855A", "67"], ["picture_blank", "4054", "24"],
    ["input_video", "4054", "2A"], ["input_a", "4054", "2B"], ["input_b", "4054", "2C"],
    ["input_c", "4054", "6F"], ["input_d", "4054", "70"], ["power_on", "4054", "2E"], ["power_off", "4054", "2F"]
  ]) {
    assert.deepEqual(await service.command(id), { accepted: true, command: id });
    assert.deepEqual(calls.at(-1).body, { req: { type: "send", category: "control" }, param: { category, code } });
    tick();
  }
  assert.equal(calls.length, 10);
});

test("device-specific power actions use category/code pairs, including different categories for the same code", async () => {
  const { service, calls, enable, tick } = fixture(() => new Response(null, { status: 204 }));
  const power = { powerCategory: "abcd", powerToggleCode: "af",
    powerOnCategory: "a123", powerOnCode: "af", powerOffCategory: "b123", powerOffCode: "af" };
  for (const override of [
    { powerOnCategory: "ABCD" }, { powerOnCategory: "" }, { powerOffCategory: "A123" },
    { powerOffCategory: "4054", powerOffCode: "15" }, { powerOnCategory: "bad" },
    { powerOffCategory: null }, { powerToggleCode: "" }, { powerToggleCode: "1gg" }
  ]) assert.throws(() => enable({ ...power, ...override }), failure(400));
  enable(power);
  for (const [id, category] of [["power_toggle", "ABCD"], ["power_on", "A123"], ["power_off", "B123"]]) {
    await service.command(id);
    assert.deepEqual(calls.at(-1).body.param, { category, code: "AF" });
    tick();
  }
  enable({ ...power, powerOnCategory: "", powerOnCode: "b1" });
  await service.command("power_on");
  assert.deepEqual(calls.at(-1).body.param, { category: "ABCD", code: "B1" });
});

test("pending and repeat commands are refused; an ambiguous send failure is never retried", async () => {
  let reject;
  const { service, calls, enable, tick } = fixture(() => new Promise((resolve, fail) => { reject = fail; }));
  enable();
  const first = service.command("power_toggle");
  await assert.rejects(service.command("power_toggle"), failure(429));
  assert.throws(() => enable({ host: "newhost" }), failure(409));
  tick(3000);
  await assert.rejects(service.command("power_toggle"), failure(429));
  reject(new Error("some upstream details"));
  await assert.rejects(first, error => error.status === 502 && !error.message.includes("upstream details"));
  assert.equal(calls.length, 1);
  const second = service.command("freeze");
  reject(new Error());
  await assert.rejects(second, failure(502));
  tick(1999);
  await assert.rejects(service.command("power_toggle"), failure(429));
  assert.equal(calls.length, 2);
});

test("status polls share a pending read; old-device response is discarded after reconfiguration", async () => {
  let complete;
  const { service, enable, calls } = fixture(() => new Promise(resolve => { complete = resolve; }));
  enable();
  const first = service.status();
  const also = service.status();
  assert.equal(calls.length, 1);
  enable({ host: "second-projector.local" });
  complete(Response.json({ current_power_is_on: true }));
  await Promise.all([assert.rejects(first, failure(409)), assert.rejects(also, failure(409))]);
  const fresh = service.status();
  complete(Response.json({ current_power_is_on: false }));
  assert.equal((await fresh).powerOn, false);
  assert.equal(calls[1].url, "http://second-projector.local:8001/cgi-bin/web.cgi");
});

test("upstream errors, malformed and oversized responses cannot leak raw response bodies", async () => {
  for (const make of [
    () => new Response("private details", { status: 503 }),
    () => new Response("private details"),
    () => new Response("{}", { headers: { "content-length": "70000" } }),
    () => new Response(JSON.stringify({ current_input: "a".repeat(65536) }))
  ]) {
    const { service, enable } = fixture(make);
    enable();
    await assert.rejects(service.status(), error => error.status === 502 && !error.message.includes("private details"));
  }
});

test("a timeout is reported without replaying a command", async () => {
  // AbortSignal.timeout uses an unreferenced timer, keep this unit test alive until abort.
  const keepAlive = setTimeout(() => {}, 1000);
  try {
    const { service, enable, calls } = fixture((_call, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }), { timeoutMs: 25 });
    enable();
    await assert.rejects(service.command("input_b"), failure(504));
    assert.equal(calls.length, 1);
  } finally { clearTimeout(keepAlive); }
});
