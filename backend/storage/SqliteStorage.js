import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

const COUNTERS = [
  "nextMatrixId", "nextConPortId", "nextCpuPortId", "nextDiagramId",
  "nextDiagramScreenId", "nextDiagramScreenCpuPortId", "nextDefaultStateId",
  "nextDefaultStateVideoConnectionId", "nextDefaultStateKwmConnectionId",
  "nextWeeklyTimerId", "nextWeeklyTimerVideoConnectionId",
  "nextWeeklyTimerKwmConnectionId", "nextWeeklyTimerDefaultStateId",
  "nextConGroupId"
];

let database = null;
let sqliteFile = "";

const values = collection => Object.keys(collection || {}).map(id => collection[id]);
const mapById = rows => rows.reduce((result, row) => {
  result[String(row.id)] = row;
  return result;
}, {});

function migrateSchema(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
  `);
  const version = db.prepare("SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations").get().version;
  if (version < 1) {
    db.exec(`
      BEGIN;
      CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE matrices (id INTEGER PRIMARY KEY, slug TEXT NOT NULL, ip TEXT NOT NULL, port INTEGER, number_of_con_ports INTEGER NOT NULL, number_of_cpu_ports INTEGER NOT NULL, mock INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE con_ports (id INTEGER PRIMARY KEY, slug TEXT NOT NULL, matrix_id INTEGER NOT NULL REFERENCES matrices(id) ON DELETE CASCADE, port_num INTEGER NOT NULL);
      CREATE TABLE cpu_ports (id INTEGER PRIMARY KEY, slug TEXT NOT NULL, matrix_id INTEGER NOT NULL REFERENCES matrices(id) ON DELETE CASCADE, port_num INTEGER NOT NULL);
      CREATE TABLE diagrams (id INTEGER PRIMARY KEY, slug TEXT NOT NULL);
      CREATE TABLE diagram_screens (id INTEGER PRIMARY KEY, slug TEXT NOT NULL, diagram_id INTEGER NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE, matrix_id INTEGER REFERENCES matrices(id) ON DELETE SET NULL, con_port_id INTEGER REFERENCES con_ports(id) ON DELETE SET NULL);
      CREATE TABLE diagram_screen_cpu_ports (id INTEGER PRIMARY KEY, diagram_screen_id INTEGER NOT NULL REFERENCES diagram_screens(id) ON DELETE CASCADE, cpu_port_id INTEGER NOT NULL REFERENCES cpu_ports(id) ON DELETE CASCADE);
      CREATE TABLE default_states (id INTEGER PRIMARY KEY, slug TEXT NOT NULL, matrix_id INTEGER NOT NULL REFERENCES matrices(id) ON DELETE CASCADE);
      CREATE TABLE default_state_video_connections (id INTEGER PRIMARY KEY, con_port_id INTEGER NOT NULL REFERENCES con_ports(id) ON DELETE CASCADE, cpu_port_id INTEGER NOT NULL REFERENCES cpu_ports(id) ON DELETE CASCADE, default_state_id INTEGER NOT NULL REFERENCES default_states(id) ON DELETE CASCADE);
      CREATE TABLE default_state_kwm_connections (id INTEGER PRIMARY KEY, con_port_id INTEGER NOT NULL REFERENCES con_ports(id) ON DELETE CASCADE, cpu_port_id INTEGER NOT NULL REFERENCES cpu_ports(id) ON DELETE CASCADE, default_state_id INTEGER NOT NULL REFERENCES default_states(id) ON DELETE CASCADE);
      CREATE TABLE weekly_timers (id INTEGER PRIMARY KEY, slug TEXT NOT NULL, minutes INTEGER NOT NULL, hours INTEGER NOT NULL, active INTEGER NOT NULL, monday INTEGER NOT NULL, tuesday INTEGER NOT NULL, wednesday INTEGER NOT NULL, thursday INTEGER NOT NULL, friday INTEGER NOT NULL, saturday INTEGER NOT NULL, sunday INTEGER NOT NULL);
      CREATE TABLE weekly_timer_video_connections (id INTEGER PRIMARY KEY, weekly_timer_id INTEGER NOT NULL REFERENCES weekly_timers(id) ON DELETE CASCADE, con_port_id INTEGER NOT NULL REFERENCES con_ports(id) ON DELETE CASCADE, cpu_port_id INTEGER NOT NULL REFERENCES cpu_ports(id) ON DELETE CASCADE);
      CREATE TABLE weekly_timer_kwm_connections (id INTEGER PRIMARY KEY, weekly_timer_id INTEGER NOT NULL REFERENCES weekly_timers(id) ON DELETE CASCADE, con_port_id INTEGER NOT NULL REFERENCES con_ports(id) ON DELETE CASCADE, cpu_port_id INTEGER NOT NULL REFERENCES cpu_ports(id) ON DELETE CASCADE);
      CREATE TABLE weekly_timer_default_states (id INTEGER PRIMARY KEY, weekly_timer_id INTEGER NOT NULL REFERENCES weekly_timers(id) ON DELETE CASCADE, default_state_id INTEGER NOT NULL REFERENCES default_states(id) ON DELETE CASCADE);
      CREATE TABLE con_groups (id INTEGER PRIMARY KEY, slug TEXT NOT NULL, matrix_id INTEGER NOT NULL REFERENCES matrices(id) ON DELETE CASCADE);
      CREATE TABLE con_group_ports (con_group_id INTEGER NOT NULL REFERENCES con_groups(id) ON DELETE CASCADE, con_port_id INTEGER NOT NULL REFERENCES con_ports(id) ON DELETE CASCADE, position INTEGER NOT NULL, PRIMARY KEY (con_group_id, con_port_id));
      CREATE TABLE rest_api_keys (id TEXT PRIMARY KEY, name TEXT NOT NULL, api_key TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, use_count INTEGER NOT NULL DEFAULT 0, last_used_at TEXT NOT NULL DEFAULT '');
      CREATE INDEX idx_con_ports_matrix ON con_ports(matrix_id);
      CREATE INDEX idx_cpu_ports_matrix ON cpu_ports(matrix_id);
      CREATE INDEX idx_diagram_screens_diagram ON diagram_screens(diagram_id);
      CREATE INDEX idx_default_states_matrix ON default_states(matrix_id);
      INSERT INTO schema_migrations(version, applied_at) VALUES (1, datetime('now'));
      COMMIT;
    `);
  }
  if (version < 2) {
    db.exec(`
      BEGIN;
      CREATE TABLE audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        actor_type TEXT NOT NULL,
        actor_id TEXT NOT NULL DEFAULT '',
        actor_name TEXT NOT NULL DEFAULT '',
        action TEXT NOT NULL,
        target TEXT NOT NULL DEFAULT '',
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        success INTEGER NOT NULL,
        ip_address TEXT NOT NULL DEFAULT '',
        details TEXT NOT NULL DEFAULT '{}'
      );
      CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
      CREATE INDEX idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
      INSERT INTO schema_migrations(version, applied_at) VALUES (2, datetime('now'));
      COMMIT;
    `);
  }
  if (version < 3) {
    db.exec(`
      BEGIN;
      INSERT INTO schema_migrations(version, applied_at) VALUES (3, datetime('now'));
      COMMIT;
    `);
  }
}

function tableHasData(db) {
  return Boolean(db.prepare("SELECT value FROM metadata WHERE key = 'initialized'").get());
}

function insertRows(db, sql, rows, mapper) {
  const statement = db.prepare(sql);
  rows.forEach(row => statement.run(...mapper(row)));
}

export function saveDatabase(state) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  database.exec("BEGIN IMMEDIATE");
  try {
    [
      "con_group_ports", "weekly_timer_default_states", "weekly_timer_kwm_connections",
      "weekly_timer_video_connections", "default_state_kwm_connections",
      "default_state_video_connections", "diagram_screen_cpu_ports", "diagram_screens",
      "con_groups", "weekly_timers", "default_states", "diagrams", "con_ports",
      "cpu_ports", "matrices", "rest_api_keys", "metadata"
    ].forEach(table => database.exec(`DELETE FROM ${table}`));

    insertRows(database, "INSERT INTO matrices VALUES (?, ?, ?, ?, ?, ?, ?)", values(state.matrixs), row => [row.id, row.slug || "", row.ip || "", Number(row.port || 0), Number(row.numberOfConPorts || 0), Number(row.numberOfCpuPorts || 0), row.mock ? 1 : 0]);
    insertRows(database, "INSERT INTO con_ports VALUES (?, ?, ?, ?)", values(state.conPorts), row => [row.id, row.slug || "", row.matrixId, row.portNum]);
    insertRows(database, "INSERT INTO cpu_ports VALUES (?, ?, ?, ?)", values(state.cpuPorts), row => [row.id, row.slug || "", row.matrixId, row.portNum]);
    insertRows(database, "INSERT INTO diagrams VALUES (?, ?)", values(state.diagrams), row => [row.id, row.slug || ""]);
    insertRows(database, "INSERT INTO diagram_screens VALUES (?, ?, ?, ?, ?)", values(state.diagramScreens), row => [row.id, row.slug || "", row.diagramId, row.matrixId || null, row.conPortId || null]);
    insertRows(database, "INSERT INTO diagram_screen_cpu_ports VALUES (?, ?, ?)", values(state.diagramScreenCpuPorts), row => [row.id, row.diagramScreenId, row.cpuPortId]);
    insertRows(database, "INSERT INTO default_states VALUES (?, ?, ?)", values(state.defaultStates), row => [row.id, row.slug || "", row.matrixId]);
    insertRows(database, "INSERT INTO default_state_video_connections VALUES (?, ?, ?, ?)", values(state.defaultStateVideoConnections), row => [row.id, row.conPortId, row.cpuPortId, row.defaultStateId]);
    insertRows(database, "INSERT INTO default_state_kwm_connections VALUES (?, ?, ?, ?)", values(state.defaultStateKwmConnections), row => [row.id, row.conPortId, row.cpuPortId, row.defaultStateId]);
    insertRows(database, "INSERT INTO weekly_timers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", values(state.weeklyTimers), row => [row.id, row.slug || "", row.minutes || 0, row.hours || 0, row.active ? 1 : 0, row.monday ? 1 : 0, row.tuesday ? 1 : 0, row.wednesday ? 1 : 0, row.thursday ? 1 : 0, row.friday ? 1 : 0, row.saturday ? 1 : 0, row.sunday ? 1 : 0]);
    insertRows(database, "INSERT INTO weekly_timer_video_connections VALUES (?, ?, ?, ?)", values(state.weeklyTimerVideoConnections), row => [row.id, row.weeklyTimerId, row.conPortId, row.cpuPortId]);
    insertRows(database, "INSERT INTO weekly_timer_kwm_connections VALUES (?, ?, ?, ?)", values(state.weeklyTimerKwmConnections), row => [row.id, row.weeklyTimerId, row.conPortId, row.cpuPortId]);
    insertRows(database, "INSERT INTO weekly_timer_default_states VALUES (?, ?, ?)", values(state.weeklyTimerDefaultStates), row => [row.id, row.weeklyTimerId, row.defaultStateId]);
    insertRows(database, "INSERT INTO con_groups VALUES (?, ?, ?)", values(state.conGroups), row => [row.id, row.slug || "", row.matrixId]);
    values(state.conGroups).forEach(group => (group.conPortIds || []).forEach((conPortId, position) => database.prepare("INSERT INTO con_group_ports VALUES (?, ?, ?)").run(group.id, conPortId, position)));
    insertRows(database, "INSERT INTO rest_api_keys VALUES (?, ?, ?, ?, ?, ?, ?, ?)", state.restApiKeys || [], row => [row.id, row.name || "Nimetön avain", row.key, row.createdAt || new Date().toISOString(), row.expiresAt || "", row.enabled === false ? 0 : 1, Number(row.useCount || 0), row.lastUsedAt || ""]);

    const metadata = database.prepare("INSERT INTO metadata(key, value) VALUES (?, ?)");
    COUNTERS.forEach(counter => metadata.run(counter, String(Number(state[counter] || 1))));
    metadata.run("restApiAnonymousUntil", state.restApiAnonymousUntil || "");
    metadata.run("initialized", "1");
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function loadDatabase() {
  if (!database || !tableHasData(database)) return null;
  const state = {};
  database.prepare("SELECT key, value FROM metadata").all().forEach(row => {
    if (row.key !== "initialized") {
      state[row.key] = COUNTERS.includes(row.key) ? Number(row.value) : row.value;
    }
  });
  state.matrixs = mapById(database.prepare("SELECT id, slug, ip, port, number_of_con_ports AS numberOfConPorts, number_of_cpu_ports AS numberOfCpuPorts, mock FROM matrices").all().map(row => Object.assign(row, { mock: Boolean(row.mock) })));
  state.conPorts = mapById(database.prepare("SELECT id, slug, matrix_id AS matrixId, port_num AS portNum FROM con_ports").all());
  state.cpuPorts = mapById(database.prepare("SELECT id, slug, matrix_id AS matrixId, port_num AS portNum FROM cpu_ports").all());
  state.diagrams = mapById(database.prepare("SELECT id, slug FROM diagrams").all());
  state.diagramScreens = mapById(database.prepare("SELECT id, slug, diagram_id AS diagramId, matrix_id AS matrixId, con_port_id AS conPortId FROM diagram_screens").all());
  state.diagramScreenCpuPorts = mapById(database.prepare("SELECT id, diagram_screen_id AS diagramScreenId, cpu_port_id AS cpuPortId FROM diagram_screen_cpu_ports").all());
  state.defaultStates = mapById(database.prepare("SELECT id, slug, matrix_id AS matrixId FROM default_states").all());
  state.defaultStateVideoConnections = mapById(database.prepare("SELECT id, con_port_id AS conPortId, cpu_port_id AS cpuPortId, default_state_id AS defaultStateId FROM default_state_video_connections").all());
  state.defaultStateKwmConnections = mapById(database.prepare("SELECT id, con_port_id AS conPortId, cpu_port_id AS cpuPortId, default_state_id AS defaultStateId FROM default_state_kwm_connections").all());
  state.weeklyTimers = mapById(database.prepare("SELECT * FROM weekly_timers").all().map(row => ({ id: row.id, slug: row.slug, minutes: row.minutes, hours: row.hours, active: Boolean(row.active), monday: Boolean(row.monday), tuesday: Boolean(row.tuesday), wednesday: Boolean(row.wednesday), thursday: Boolean(row.thursday), friday: Boolean(row.friday), saturday: Boolean(row.saturday), sunday: Boolean(row.sunday) })));
  state.weeklyTimerVideoConnections = mapById(database.prepare("SELECT id, weekly_timer_id AS weeklyTimerId, con_port_id AS conPortId, cpu_port_id AS cpuPortId FROM weekly_timer_video_connections").all());
  state.weeklyTimerKwmConnections = mapById(database.prepare("SELECT id, weekly_timer_id AS weeklyTimerId, con_port_id AS conPortId, cpu_port_id AS cpuPortId FROM weekly_timer_kwm_connections").all());
  state.weeklyTimerDefaultStates = mapById(database.prepare("SELECT id, weekly_timer_id AS weeklyTimerId, default_state_id AS defaultStateId FROM weekly_timer_default_states").all());
  const groupPorts = database.prepare("SELECT con_group_id AS conGroupId, con_port_id AS conPortId FROM con_group_ports ORDER BY position").all();
  state.conGroups = mapById(database.prepare("SELECT id, slug, matrix_id AS matrixId FROM con_groups").all().map(group => Object.assign(group, { conPortIds: groupPorts.filter(port => port.conGroupId === group.id).map(port => port.conPortId) })));
  state.restApiKeys = database.prepare("SELECT id, name, api_key AS key, created_at AS createdAt, expires_at AS expiresAt, enabled, use_count AS useCount, last_used_at AS lastUsedAt FROM rest_api_keys").all().map(row => Object.assign(row, { enabled: Boolean(row.enabled) }));
  return state;
}

export function initializeDatabaseStorage({ sqlitePath, jsonPath }) {
  sqliteFile = path.resolve(sqlitePath);
  fs.mkdirSync(path.dirname(sqliteFile), { recursive: true });
  database = new DatabaseSync(sqliteFile);
  migrateSchema(database);
  getAuditRetentionDays();
  if (!tableHasData(database) && jsonPath && fs.existsSync(jsonPath)) {
    const sourcePath = path.resolve(jsonPath);
    const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    saveDatabase(source);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backup = path.join(path.dirname(sourcePath), `database.pre-sqlite-backup.${timestamp}.json`);
    fs.copyFileSync(sourcePath, backup);
    console.log(`Migrated ${sourcePath} to ${sqliteFile}; backup: ${backup}`);
  }
  return loadDatabase();
}

export function exportDatabaseToJson(outputPath) {
  const state = loadDatabase();
  if (!state) throw new Error("SQLite database is empty");
  const resolvedOutputPath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
  fs.writeFileSync(resolvedOutputPath, JSON.stringify(state, null, 2));
  return resolvedOutputPath;
}

export function getSqlitePath() {
  return sqliteFile;
}

export function appendAuditLog(entry) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  const details = typeof entry.details === "string" ? entry.details : JSON.stringify(entry.details || {});
  const result = database.prepare(`
    INSERT INTO audit_logs (
      created_at, actor_type, actor_id, actor_name, action, target,
      method, path, status_code, success, ip_address, details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.createdAt || new Date().toISOString(),
    entry.actorType || "unknown",
    entry.actorId || "",
    entry.actorName || "",
    entry.action || "unknown",
    entry.target || "",
    entry.method || "",
    entry.path || "",
    Number(entry.statusCode || 0),
    entry.success ? 1 : 0,
    entry.ipAddress || "",
    details.slice(0, 8000)
  );
  purgeExpiredAuditLogs();
  return Number(result.lastInsertRowid);
}

export function listAuditLogs({ limit = 200, offset = 0 } = {}) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  purgeExpiredAuditLogs();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 200, 500));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const rows = database.prepare(`
    SELECT id, created_at AS createdAt, actor_type AS actorType,
      actor_id AS actorId, actor_name AS actorName, action, target,
      method, path, status_code AS statusCode, success,
      ip_address AS ipAddress, details
    FROM audit_logs
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(safeLimit, safeOffset).map(row => {
    try {
      row.details = JSON.parse(row.details || "{}");
    } catch (error) {
      row.details = {};
    }
    row.success = Boolean(row.success);
    return row;
  });
  const total = Number(database.prepare("SELECT COUNT(*) AS total FROM audit_logs").get().total);
  return { rows, total, limit: safeLimit, offset: safeOffset };
}

export function getAuditRetentionDays() {
  const configuredValue = process.env.TAISTO_AUDIT_RETENTION_DAYS;
  const retentionDays = configuredValue == null || configuredValue === "" ? 90 : Number(configuredValue);
  if (!Number.isInteger(retentionDays) || retentionDays < 0 || retentionDays > 3650) {
    throw new Error("TAISTO_AUDIT_RETENTION_DAYS must be an integer between 0 and 3650");
  }
  return retentionDays;
}

function purgeExpiredAuditLogs() {
  const retentionDays = getAuditRetentionDays();
  if (retentionDays === 0) return;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  database.prepare("DELETE FROM audit_logs WHERE created_at < ?").run(cutoff);
}
