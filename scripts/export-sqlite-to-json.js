import path from "path";
import { initializeDatabaseStorage, exportDatabaseToJson } from "../backend/storage/SqliteStorage";

const argument = name => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
};

const sqlitePath = path.resolve(argument("--sqlite") || "database/taisto.sqlite");
const outputPath = path.resolve(argument("--output") || `database/database-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);

initializeDatabaseStorage({ sqlitePath });
exportDatabaseToJson(outputPath);
console.log(`JSON export written to ${outputPath}`);
