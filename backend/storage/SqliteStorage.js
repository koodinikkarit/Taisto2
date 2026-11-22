import fs from "fs";
import path from "path";
import crypto from "crypto";
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
let activePasswordChecks = 0;
const auditLogListeners = new Set();

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
  if (version < 4) {
    db.exec(`
      BEGIN;
      ALTER TABLE con_groups ADD COLUMN use_all_cpu_ports INTEGER NOT NULL DEFAULT 1;
      CREATE TABLE con_group_cpu_ports (
        con_group_id INTEGER NOT NULL REFERENCES con_groups(id) ON DELETE CASCADE,
        cpu_port_id INTEGER NOT NULL REFERENCES cpu_ports(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        PRIMARY KEY (con_group_id, cpu_port_id)
      );
      INSERT INTO schema_migrations(version, applied_at) VALUES (4, datetime('now'));
      COMMIT;
    `);
  }
  if (version < 5) {
    db.exec(`
      BEGIN;
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL COLLATE NOCASE UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE auth_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      INSERT INTO schema_migrations(version, applied_at) VALUES (5, datetime('now'));
      COMMIT;
    `);
  }
  if (version < 6) {
    db.exec(`
      BEGIN;
      ALTER TABLE users ADD COLUMN last_login_at TEXT NOT NULL DEFAULT '';
      ALTER TABLE users ADD COLUMN login_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN last_login_ip TEXT NOT NULL DEFAULT '';
      INSERT INTO schema_migrations(version, applied_at) VALUES (6, datetime('now'));
      COMMIT;
    `);
  }
  if (version < 7) {
    db.exec(`
      BEGIN;
      CREATE TABLE auth_sessions (token_hash TEXT PRIMARY KEY, source TEXT NOT NULL, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
      CREATE INDEX idx_auth_sessions_user ON auth_sessions(source, user_id);
      INSERT INTO schema_migrations(version, applied_at) VALUES (7, datetime('now'));
      COMMIT;
    `);
  }
  if (version < 8) {
    db.exec(`
      BEGIN;
      CREATE TABLE telegram_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        enabled INTEGER NOT NULL DEFAULT 0,
        bot_token TEXT NOT NULL DEFAULT '',
        allowed_user_ids TEXT NOT NULL DEFAULT '',
        audit_enabled INTEGER NOT NULL DEFAULT 0,
        audit_chat_id TEXT NOT NULL DEFAULT ''
      );
      INSERT INTO schema_migrations(version, applied_at) VALUES (8, datetime('now'));
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

export function saveDatabase(state, { backupUsers = null } = {}) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  database.exec("BEGIN IMMEDIATE");
  try {
    [
      "con_group_cpu_ports", "con_group_ports", "weekly_timer_default_states", "weekly_timer_kwm_connections",
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
    insertRows(database, "INSERT INTO con_groups(id, slug, matrix_id, use_all_cpu_ports) VALUES (?, ?, ?, ?)", values(state.conGroups), row => [row.id, row.slug || "", row.matrixId, row.useAllCpuPorts === false ? 0 : 1]);
    values(state.conGroups).forEach(group => (group.conPortIds || []).forEach((conPortId, position) => database.prepare("INSERT INTO con_group_ports VALUES (?, ?, ?)").run(group.id, conPortId, position)));
    values(state.conGroups).forEach(group => (group.cpuPortIds || []).forEach((cpuPortId, position) => database.prepare("INSERT INTO con_group_cpu_ports VALUES (?, ?, ?)").run(group.id, cpuPortId, position)));
    insertRows(database, "INSERT INTO rest_api_keys VALUES (?, ?, ?, ?, ?, ?, ?, ?)", state.restApiKeys || [], row => [row.id, row.name || "Nimetön avain", row.key, row.createdAt || new Date().toISOString(), row.expiresAt || "", row.enabled === false ? 0 : 1, Number(row.useCount || 0), row.lastUsedAt || ""]);

    // Authentication is imported only from an explicit backup during initial migration.
    // Ordinary application-state saves must never replace the users table.
    if (backupUsers !== null) {
      if (Number(database.prepare("SELECT COUNT(*) AS total FROM users").get().total) !== 0) {
        throw new Error("Cannot import backup users into a database that already has users");
      }
      insertRows(database, `INSERT INTO users(id, username, password_hash, password_salt, role, created_at, updated_at, last_login_at, login_count, last_login_ip)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, backupUsers, row => [row.id, row.username, row.password_hash, row.password_salt, row.role, row.created_at, row.updated_at, row.last_login_at || "", Number(row.login_count || 0), row.last_login_ip || ""]);
    }

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
  const groupCpuPorts = database.prepare("SELECT con_group_id AS conGroupId, cpu_port_id AS cpuPortId FROM con_group_cpu_ports ORDER BY position").all();
  state.conGroups = mapById(database.prepare("SELECT id, slug, matrix_id AS matrixId, use_all_cpu_ports AS useAllCpuPorts FROM con_groups").all().map(group => Object.assign(group, {
    useAllCpuPorts: Boolean(group.useAllCpuPorts),
    conPortIds: groupPorts.filter(port => port.conGroupId === group.id).map(port => port.conPortId),
    cpuPortIds: groupCpuPorts.filter(port => port.conGroupId === group.id).map(port => port.cpuPortId)
  })));
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
    let backupUsers = null;
    if (Object.prototype.hasOwnProperty.call(source, "taistoBackup")) {
      const backup = source.taistoBackup;
      if (!backup || backup.version !== 1 || !Array.isArray(backup.users) || typeof backup.requiresEnvironmentPassword !== "boolean") {
        throw new Error("Invalid Taisto backup authentication data");
      }
      const hasAdmin = backup.users.some(user => user.role === "admin");
      const allowAnonymousRestore = backup.users.length === 0 && process.env.TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE === "true";
      if (!process.env.TAISTO_PASSWORD && (backup.requiresEnvironmentPassword || !hasAdmin) && !allowAnonymousRestore) {
        throw new Error("TAISTO_PASSWORD is required to restore this backup without an admin account. Set TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE=true only to explicitly allow an anonymous restore.");
      }
      backupUsers = backup.users;
    } else if (!process.env.TAISTO_PASSWORD && process.env.TAISTO_ALLOW_UNPROTECTED_LEGACY_IMPORT !== "true") {
      throw new Error("Legacy JSON may not contain user accounts. Set TAISTO_PASSWORD or explicitly set TAISTO_ALLOW_UNPROTECTED_LEGACY_IMPORT=true to allow an unprotected import.");
    }
    saveDatabase(source, { backupUsers });
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
  const users = database.prepare("SELECT id, username, password_hash, password_salt, role, created_at, updated_at, last_login_at, login_count, last_login_ip FROM users ORDER BY id").all();
  state.taistoBackup = {
    version: 1,
    users,
    // Environment credentials are not copied into backups. Require them again on restore.
    requiresEnvironmentPassword: !users.some(user => user.role === "admin")
  };
  const resolvedOutputPath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
  // Secure an existing file before replacing its contents; open-mode alone only
  // applies permissions when the file is newly created.
  let fd;
  try {
    fd = fs.openSync(resolvedOutputPath, "r+");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    fd = fs.openSync(resolvedOutputPath, "wx+", 0o600);
  }
  try {
    fs.fchmodSync(fd, 0o600);
    fs.ftruncateSync(fd, 0);
    fs.writeFileSync(fd, JSON.stringify(state, null, 2));
  } finally {
    fs.closeSync(fd);
  }
  return resolvedOutputPath;
}

export function getSqlitePath() {
  return sqliteFile;
}

// This internal getter contains the bot token. Never return it directly over HTTP.
export function getTelegramConfig() {
  if (!database) throw new Error("SQLite storage has not been initialized");
  const row = database.prepare("SELECT enabled, bot_token, allowed_user_ids, audit_enabled, audit_chat_id FROM telegram_settings WHERE id = 1").get();
  return row ? {
    enabled: Boolean(row.enabled), botToken: row.bot_token, allowedUserIds: row.allowed_user_ids ? row.allowed_user_ids.split(", ") : [],
    auditEnabled: Boolean(row.audit_enabled), auditChatId: row.audit_chat_id
  } : { enabled: false, botToken: "", allowedUserIds: [], auditEnabled: false, auditChatId: "" };
}

export function saveTelegramConfig(input) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      typeof input.enabled !== "boolean" || typeof input.auditEnabled !== "boolean" ||
      typeof input.allowedUserIds !== "string" || typeof input.auditChatId !== "string" ||
      (input.token !== undefined && typeof input.token !== "string")) {
    throw new Error("Invalid Telegram settings");
  }
  if ((input.token || "").length > 256 || input.allowedUserIds.length > 4096 || input.auditChatId.length > 20) {
    throw new Error("Telegram settings exceed the maximum length");
  }
  const token = (input.token || "").trim() || getTelegramConfig().botToken;
  if (token && !/^[0-9]{5,15}:[A-Za-z0-9_-]{20,128}$/.test(token)) {
    throw new Error("Invalid Telegram bot token");
  }
  const ids = input.allowedUserIds.trim() ? input.allowedUserIds.trim().split(/[\s,]+/) : [];
  if (ids.some(id => !/^[1-9][0-9]{0,15}$/.test(id))) {
    throw new Error("Allowed Telegram user IDs must be positive numeric IDs");
  }
  const allowedUserIds = [...new Set(ids)].join(", ");
  const auditChatId = input.auditChatId.trim();
  if (auditChatId && !/^-?[1-9][0-9]{0,15}$/.test(auditChatId)) {
    throw new Error("Invalid Telegram audit chat ID");
  }
  if ((input.enabled || input.auditEnabled) && !token) {
    throw new Error("Bot token is required");
  }
  if (input.auditEnabled && !auditChatId) throw new Error("Audit chat ID is required");
  database.prepare(`INSERT INTO telegram_settings (id, enabled, bot_token, allowed_user_ids, audit_enabled, audit_chat_id)
    VALUES (1, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET enabled = excluded.enabled,
    bot_token = excluded.bot_token, allowed_user_ids = excluded.allowed_user_ids,
    audit_enabled = excluded.audit_enabled, audit_chat_id = excluded.audit_chat_id`).run(
      input.enabled ? 1 : 0, token, allowedUserIds, input.auditEnabled ? 1 : 0, auditChatId
    );
  return getTelegramConfig();
}

export function closeDatabaseStorage() {
  if (database) database.close();
  database = null;
  sqliteFile = "";
}

const publicUser = row => row ? {
  id: Number(row.id),
  username: row.username,
  role: row.role,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastLoginAt: row.last_login_at || "",
  loginCount: Number(row.login_count || 0),
  lastLoginIp: row.last_login_ip || ""
} : null;

const normalizeUsername = username => String(username || "").trim();
const normalizeRole = role => role === "user" ? "user" : role === "admin" ? "admin" : "";

function passwordDigest(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString("base64url");
}

function assertUserInput(username, password, role, passwordRequired = true) {
  const normalizedUsername = normalizeUsername(username);
  if (normalizedUsername.length < 3 || normalizedUsername.length > 64) throw new Error("Username must be between 3 and 64 characters");
  if (!/^[\p{L}\p{N}_.@-]+$/u.test(normalizedUsername)) throw new Error("Username contains unsupported characters");
  if (passwordRequired && String(password || "").length < 8) throw new Error("Password must contain at least 8 characters");
  if (!normalizeRole(role)) throw new Error("Role must be admin or user");
  return { username: normalizedUsername, role: normalizeRole(role) };
}

export function countUsers() {
  if (!database) throw new Error("SQLite storage has not been initialized");
  return Number(database.prepare("SELECT COUNT(*) AS total FROM users").get().total);
}

export function countAdminUsers() {
  if (!database) throw new Error("SQLite storage has not been initialized");
  return Number(database.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'").get().total);
}

export function listUsers() {
  if (!database) throw new Error("SQLite storage has not been initialized");
  return database.prepare("SELECT id, username, role, created_at, updated_at, last_login_at, login_count, last_login_ip FROM users ORDER BY username COLLATE NOCASE").all().map(publicUser);
}

export function getUserById(id) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  return publicUser(database.prepare("SELECT id, username, role, created_at, updated_at, last_login_at, login_count, last_login_ip FROM users WHERE id = ?").get(Number(id)));
}

export function authenticateUser(username, password) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  const row = database.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE").get(normalizeUsername(username));
  if (!row) return null;
  const actual = Buffer.from(passwordDigest(password || "", row.password_salt), "base64url");
  const expected = Buffer.from(row.password_hash, "base64url");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected) ? publicUser(row) : null;
}

export async function authenticateUserAsync(username, password) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  const row = database.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE").get(normalizeUsername(username));
  if (!row) return null;
  if (activePasswordChecks >= 4) {
    const error = new Error("Too many authentication attempts");
    error.status = 429;
    throw error;
  }
  activePasswordChecks++;
  let actual;
  try {
    actual = await new Promise((resolve, reject) => crypto.scrypt(String(password || ""), row.password_salt, 64, (error, result) => error ? reject(error) : resolve(result)));
  } finally {
    activePasswordChecks--;
  }
  const expected = Buffer.from(row.password_hash, "base64url");
  // Recheck the stored hash after the asynchronous operation so password changes cannot race a login.
  const current = database.prepare("SELECT password_hash FROM users WHERE id = ?").get(row.id);
  return current && current.password_hash === row.password_hash && actual.length === expected.length && crypto.timingSafeEqual(actual, expected) ? getUserById(row.id) : null;
}

export function recordUserLogin(id, ipAddress = "") {
  if (!database) throw new Error("SQLite storage has not been initialized");
  database.prepare(`
    UPDATE users
    SET last_login_at = ?, login_count = login_count + 1, last_login_ip = ?
    WHERE id = ?
  `).run(new Date().toISOString(), String(ipAddress || "").slice(0, 120), Number(id));
  return getUserById(id);
}

export function createUser({ username, password, role }) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  const input = assertUserInput(username, password, countUsers() === 0 ? "admin" : role);
  const salt = crypto.randomBytes(16).toString("base64url");
  const now = new Date().toISOString();
  const result = database.prepare(`
    INSERT INTO users(username, password_hash, password_salt, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(input.username, passwordDigest(password, salt), salt, input.role, now, now);
  return getUserById(result.lastInsertRowid);
}

export function updateUser(id, changes, { allowNoAdmin = false } = {}) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  const numericId = Number(id);
  const current = database.prepare("SELECT * FROM users WHERE id = ?").get(numericId);
  if (!current) return null;
  const username = changes.username === undefined ? current.username : normalizeUsername(changes.username);
  const role = changes.role === undefined ? current.role : normalizeRole(changes.role);
  assertUserInput(username, changes.password, role, false);
  if (current.role === "admin" && role !== "admin") {
    const admins = Number(database.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'").get().total);
    if (admins <= 1 && !allowNoAdmin) throw new Error("The last admin cannot be demoted without an environment admin credential");
  }
  let passwordHash = current.password_hash;
  let passwordSalt = current.password_salt;
  if (changes.password !== undefined && changes.password !== "") {
    if (String(changes.password).length < 8) throw new Error("Password must contain at least 8 characters");
    passwordSalt = crypto.randomBytes(16).toString("base64url");
    passwordHash = passwordDigest(changes.password, passwordSalt);
  }
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare(`
      UPDATE users SET username = ?, password_hash = ?, password_salt = ?, role = ?, updated_at = ? WHERE id = ?
    `).run(username, passwordHash, passwordSalt, role, new Date().toISOString(), numericId);
    if (passwordHash !== current.password_hash) revokeUserSessions("database", String(numericId));
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  return getUserById(numericId);
}

export function deleteUser(id, { allowNoAdmin = false } = {}) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  const numericId = Number(id);
  const current = database.prepare("SELECT id, role FROM users WHERE id = ?").get(numericId);
  if (!current) return false;
  if (current.role === "admin") {
    const admins = Number(database.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'").get().total);
    if (admins <= 1 && !allowNoAdmin) throw new Error("The last admin cannot be removed without an environment admin credential");
  }
  revokeUserSessions("database", String(numericId));
  database.prepare("DELETE FROM users WHERE id = ?").run(numericId);
  return true;
}

export function getAuthSessionSecret() {
  if (!database) throw new Error("SQLite storage has not been initialized");
  const existing = database.prepare("SELECT value FROM auth_settings WHERE key = 'session_secret'").get();
  if (existing) return existing.value;
  const secret = crypto.randomBytes(32).toString("base64url");
  database.prepare("INSERT INTO auth_settings(key, value) VALUES ('session_secret', ?)").run(secret);
  return secret;
}

export function registerAuthSession(tokenHash, source, userId, expiresAt) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  database.prepare("DELETE FROM auth_sessions WHERE expires_at <= ?").run(Date.now());
  database.prepare("INSERT INTO auth_sessions(token_hash, source, user_id, expires_at) VALUES (?, ?, ?, ?)").run(tokenHash, source, String(userId), expiresAt);
}

export function hasAuthSession(tokenHash) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  return Boolean(database.prepare("SELECT 1 FROM auth_sessions WHERE token_hash = ? AND expires_at > ?").get(tokenHash, Date.now()));
}

export function revokeAuthSession(tokenHash) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  database.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").run(tokenHash);
}

export function revokeUserSessions(source, userId) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  database.prepare("DELETE FROM auth_sessions WHERE source = ? AND user_id = ?").run(source, String(userId));
}

export function subscribeAuditLog(listener) {
  if (typeof listener !== "function") throw new TypeError("Audit listener must be a function");
  auditLogListeners.add(listener);
  return () => auditLogListeners.delete(listener);
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
  for (const listener of auditLogListeners) {
    try {
      const result = listener(entry);
      if (result && typeof result.then === "function") result.catch(() => console.error("Audit log listener failed"));
    } catch (_) {
      console.error("Audit log listener failed");
    }
  }
  return Number(result.lastInsertRowid);
}

export function listAuditLogs({ limit = 200, offset = 0, search = "", success = "", actorType = "", action = "", from = "", to = "" } = {}) {
  if (!database) throw new Error("SQLite storage has not been initialized");
  purgeExpiredAuditLogs();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 200, 500));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const conditions = [];
  const parameters = [];
  const safeSearch = String(search || "").trim().slice(0, 120);
  const safeActorType = String(actorType || "").trim().slice(0, 60);
  const safeAction = String(action || "").trim().slice(0, 120);
  if (safeSearch) {
    const pattern = `%${safeSearch}%`;
    conditions.push("(action LIKE ? OR actor_name LIKE ? OR actor_id LIKE ? OR target LIKE ? OR path LIKE ? OR ip_address LIKE ?)");
    parameters.push(pattern, pattern, pattern, pattern, pattern, pattern);
  }
  if (success === true || success === "true" || success === "1") {
    conditions.push("success = 1");
  } else if (success === false || success === "false" || success === "0") {
    conditions.push("success = 0");
  }
  if (safeActorType) {
    conditions.push("actor_type = ?");
    parameters.push(safeActorType);
  }
  if (safeAction) {
    conditions.push("action LIKE ?");
    parameters.push(`%${safeAction}%`);
  }
  const fromTime = from ? new Date(from) : null;
  const toTime = to ? new Date(to) : null;
  if (fromTime && Number.isFinite(fromTime.getTime())) {
    conditions.push("created_at >= ?");
    parameters.push(fromTime.toISOString());
  }
  if (toTime && Number.isFinite(toTime.getTime())) {
    conditions.push("created_at <= ?");
    parameters.push(toTime.toISOString());
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = database.prepare(`
    SELECT id, created_at AS createdAt, actor_type AS actorType,
      actor_id AS actorId, actor_name AS actorName, action, target,
      method, path, status_code AS statusCode, success,
      ip_address AS ipAddress, details
    FROM audit_logs
    ${where}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(...parameters, safeLimit, safeOffset).map(row => {
    try {
      row.details = JSON.parse(row.details || "{}");
    } catch (error) {
      row.details = {};
    }
    row.success = Boolean(row.success);
    return row;
  });
  const total = Number(database.prepare(`SELECT COUNT(*) AS total FROM audit_logs ${where}`).get(...parameters).total);
  const unfilteredTotal = Number(database.prepare("SELECT COUNT(*) AS total FROM audit_logs").get().total);
  return { rows, total, unfilteredTotal, limit: safeLimit, offset: safeOffset };
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
