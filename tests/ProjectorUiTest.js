// Run after npm run build. Uses an installed Chromium browser, not an actual projector.
const assert = require("node:assert/strict");
const { execFile } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { promisify } = require("node:util");

function browserPath() {
  const paths = [
    process.env.CHROME_BIN,
    ...[process.env.ProgramFiles, process.env["ProgramFiles(x86)"], process.env.LOCALAPPDATA]
      .filter(Boolean).flatMap(base => ["Google/Chrome/Application/chrome.exe", "Microsoft/Edge/Application/msedge.exe"].map(exe => path.join(base, exe))),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"
  ];
  const browser = paths.find(file => file && fs.existsSync(file));
  if (!browser) throw new Error("Set CHROME_BIN to an installed Chrome/Chromium executable to run this UI test.");
  return browser;
}

// This fixture executes inside the browser before the production application bundle.
function fixture() {
  localStorage.setItem("taisto-language", "en");
  window.io = () => ({ on() {}, emit() {} });
  const config = { enabled: false, host: "test-projector.invalid", port: 8001, path: "/cgi-bin/web.cgi",
    powerCategory: "4054", powerToggleCode: "15", powerOnCategory: "", powerOffCategory: "", powerOnCode: "", powerOffCode: "" };
  const status = { enabled: false, powerOn: true, currentInput: "input2", labels: { input2: "Camera" }, canPowerOn: false, canPowerOff: false };
  let offline = false, confirmPower = false, confirmations = 0;
  const commands = [], saves = [];
  window.confirm = () => { confirmations++; return confirmPower; };
  window.fetch = async (url, init = {}) => {
    if (url === "/auth/status") return Response.json({ authenticated: true, required: true, role: "admin", username: "test" });
    if (url === "/projector/status") return offline ? Response.json({}, { status: 502 }) : Response.json(status);
    if (url === "/projector/command" && init.method === "POST") {
      commands.push(JSON.parse(init.body)); return Response.json({ accepted: true });
    }
    if (url === "/settings/projector/config") {
      if (init.method === "PUT") { saves.push(JSON.parse(init.body)); Object.assign(config, saves.at(-1)); }
      return Response.json(config);
    }
    throw new Error("Unexpected fixture request: " + url);
  };
  // Make the production polling/cooldown intervals advance quickly.
  const realTimeout = window.setTimeout.bind(window);
  window.setTimeout = (fn, ms, ...args) => realTimeout(fn, [2000, 5000, 10000].includes(ms) ? 180 : ms, ...args);
  const query = selector => document.querySelector(selector);
  const check = (value, msg) => { if (!value) throw new Error(msg); };
  const wait = async (fn, label) => {
    for (let i = 0; i < 300; i++) {
      const value = fn();
      if (value) return value;
      await new Promise(resolve => realTimeout(resolve, 10));
    }
    throw new Error("Timed out: " + label);
  };
  window.addEventListener("load", async () => {
    try {
      await wait(() => query("main [role=status] a[href='/settings/projector']"), "disabled projector settings link");
      check(!query("main button") && !commands.length, "disabled projector must not expose controls or send commands");
      status.enabled = true;
      await wait(() => query("button[aria-pressed=true]")?.textContent === "Camera", "reported input label");
      check(query("button[aria-pressed=true]").disabled, "current input cannot be resent");
      check([...document.querySelectorAll("button[aria-pressed]")].map(b => b.textContent).join("/") === "Video/Camera/Input B/Input C/Input D", "unlabelled inputs should retain defaults");
      const power = [...document.querySelectorAll("main button")].find(b => b.textContent === "Toggle power");
      check(power && commands.length === 0, "status polling must not send a command");
      power.click();
      check(confirmations === 1 && commands.length === 0, "cancel must not change power");
      confirmPower = true; power.click(); power.click();
      await wait(() => commands.length === 1, "accepted power command");
      check(confirmations === 2 && commands[0].command === "power_toggle", "one confirmed click sends exactly one named toggle");
      offline = true;
      await wait(() => query("main [role=alert]"), "poll failure replaces the previous state");
      check(!query("main button") && !query("main button[aria-pressed=true]"), "offline page must not show stale controls");
      status.enabled = false; offline = false;
      const settings = await wait(() => query("main [role=status] a[href='/settings/projector']"), "recovered disabled device");
      settings.click();
      const enabled = await wait(() => query("main input[type=checkbox]"), "admin projector form");
      check(!enabled.checked && query("main input[type=number]").value === "8001", "form loads the saved config");
      enabled.click();
      query("main details").open = true;
      check(query("input[name=powerToggleCode]").value === "15", "default toggle code");
      for (const [field, value] of [["powerOnCategory", "855A"], ["powerOnCode", "11"]]) {
        const input = query('input[name="' + field + '"]');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      query("main button[type=submit]").click();
      await wait(() => saves.length === 1, "admin configuration save");
      check(saves[0].enabled && saves[0].port === 8001 && commands.length === 1, "configuration changes must not trigger hardware commands");
      check(saves[0].powerOnCategory === "855A" && saves[0].powerOnCode === "11", "persist model-specific power settings");
      document.getElementById("outcome").textContent = "PASS";
    } catch (err) { document.getElementById("outcome").textContent = "FAIL: " + err.message; }
  });
}

async function main() {
  const browser = browserPath();
  const bundle = fs.readFileSync(path.resolve(__dirname, "../public/app.js"));
  const page = '<!doctype html><meta charset="utf-8"><div id="root"></div><output id="outcome">PENDING</output><script>(' +
    fixture.toString() + ')()</script><script src="/static/app.js"></script>';
  const server = http.createServer((req, res) => {
    if (req.url === "/projector") { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(page); }
    else if (req.url === "/static/app.js") { res.setHeader("Content-Type", "text/javascript"); res.end(bundle); }
    else { res.writeHead(404).end(); }
  });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "taisto-projector-ui-"));
  try {
    await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
    const { stdout } = await promisify(execFile)(browser, [
      "--headless", "--disable-gpu", "--disable-extensions", "--disable-background-networking",
      "--no-first-run", "--no-default-browser-check", "--disable-dev-shm-usage", "--user-data-dir=" + profile,
      "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1", "--dump-dom", "--virtual-time-budget=15000",
      "http://127.0.0.1:" + server.address().port + "/projector"
    ], { windowsHide: true, timeout: 30000 });
    assert.equal(stdout.match(/<output id="outcome">([^<]+)<\/output>/)?.[1], "PASS", "projector browser smoke test");
    console.log("Projector UI smoke test passed: polling, input labels, power confirmation, cooldown, offline state and admin form");
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
