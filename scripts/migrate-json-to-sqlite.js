import path from "path";
import fs from "fs";
import { initializeDatabaseStorage, getSqlitePath } from "../backend/storage/SqliteStorage";

const argument = name => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
};

const jsonPath = path.resolve(argument("--json") || "database/database.json");
const sqlitePath = path.resolve(argument("--sqlite") || "database/taisto.sqlite");

if (!fs.existsSync(jsonPath) && !fs.existsSync(sqlitePath)) {
  throw new Error(`JSON source does not exist: ${jsonPath}`);
}

const state = initializeDatabaseStorage({ sqlitePath, jsonPath });
if (!state) throw new Error("Migration did not create an initialized SQLite database");

console.log(`SQLite database ready: ${getSqlitePath()}`);
console.log(`Matrices: ${Object.keys(state.matrixs || {}).length}, diagrams: ${Object.keys(state.diagrams || {}).length}, API keys: ${(state.restApiKeys || []).length}`);
