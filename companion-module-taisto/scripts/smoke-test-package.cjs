const path = require("path");
const { fork } = require("child_process");

const moduleDirectory = path.resolve(process.argv[2] || "");
const entrypoint = path.join(moduleDirectory, "main.js");
const manifest = path.join(moduleDirectory, "companion", "manifest.json");
const child = fork(entrypoint, [], {
  silent: true,
  env: Object.assign({}, process.env, {
    MODULE_MANIFEST: manifest,
    CONNECTION_ID: "package-smoke-test",
    VERIFICATION_TOKEN: "package-smoke-test"
  })
});

let output = "";
let finished = false;
const timeout = setTimeout(() => finish(false, "Timed out waiting for module registration"), 5000);

child.stdout.on("data", data => { output += data; });
child.stderr.on("data", data => { output += data; });
child.on("message", message => {
  if (message && message.direction === "call" && message.name === "register") {
    finish(true);
  }
});
child.on("exit", code => finish(false, `Module exited before registration with code ${code}`));

function finish(success, errorMessage = "") {
  if (finished) return;
  finished = true;
  clearTimeout(timeout);
  child.kill();
  if (output.trim()) process.stdout.write(`${output.trim()}\n`);
  if (!success) {
    process.stderr.write(`${errorMessage}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write("Companion package smoke test passed\n");
  }
}
