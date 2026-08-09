const fs = require("fs");
const path = require("path");

const fixture = path.resolve(__dirname, "..", "tests", "fixtures", "mock-database.json");
const argumentIndex = process.argv.indexOf("--output");
const output = argumentIndex >= 0
  ? path.resolve(process.argv[argumentIndex + 1])
  : path.resolve(__dirname, "..", "database", "database.json");

if (argumentIndex >= 0 && !process.argv[argumentIndex + 1]) {
  throw new Error("Missing path after --output");
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.copyFileSync(fixture, output);
const sqlitePath = path.join(path.dirname(output), "taisto.sqlite");
[sqlitePath, `${sqlitePath}-wal`, `${sqlitePath}-shm`].forEach(file => {
  if (fs.existsSync(file)) fs.unlinkSync(file);
});
console.log(`Mock database written to ${output}`);
