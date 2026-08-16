-- Taisto SQLite schema snapshot
-- Schema version: 6
--
-- The application runs incremental migrations from SqliteStorage.js automatically.
-- This file documents the current complete schema and can initialize a new database.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

BEGIN;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS matrices (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  ip TEXT NOT NULL,
  port INTEGER,
  number_of_con_ports INTEGER NOT NULL,
  number_of_cpu_ports INTEGER NOT NULL,
  mock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS con_ports (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  matrix_id INTEGER NOT NULL REFERENCES matrices(id) ON DELETE CASCADE,
  port_num INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cpu_ports (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  matrix_id INTEGER NOT NULL REFERENCES matrices(id) ON DELETE CASCADE,
  port_num INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS diagrams (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS diagram_screens (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  diagram_id INTEGER NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  matrix_id INTEGER REFERENCES matrices(id) ON DELETE SET NULL,
  con_port_id INTEGER REFERENCES con_ports(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS diagram_screen_cpu_ports (
  id INTEGER PRIMARY KEY,
  diagram_screen_id INTEGER NOT NULL REFERENCES diagram_screens(id) ON DELETE CASCADE,
  cpu_port_id INTEGER NOT NULL REFERENCES cpu_ports(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS default_states (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  matrix_id INTEGER NOT NULL REFERENCES matrices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS default_state_video_connections (
  id INTEGER PRIMARY KEY,
  con_port_id INTEGER NOT NULL REFERENCES con_ports(id) ON DELETE CASCADE,
  cpu_port_id INTEGER NOT NULL REFERENCES cpu_ports(id) ON DELETE CASCADE,
  default_state_id INTEGER NOT NULL REFERENCES default_states(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS default_state_kwm_connections (
  id INTEGER PRIMARY KEY,
  con_port_id INTEGER NOT NULL REFERENCES con_ports(id) ON DELETE CASCADE,
  cpu_port_id INTEGER NOT NULL REFERENCES cpu_ports(id) ON DELETE CASCADE,
  default_state_id INTEGER NOT NULL REFERENCES default_states(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weekly_timers (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  hours INTEGER NOT NULL,
  active INTEGER NOT NULL,
  monday INTEGER NOT NULL,
  tuesday INTEGER NOT NULL,
  wednesday INTEGER NOT NULL,
  thursday INTEGER NOT NULL,
  friday INTEGER NOT NULL,
  saturday INTEGER NOT NULL,
  sunday INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS weekly_timer_video_connections (
  id INTEGER PRIMARY KEY,
  weekly_timer_id INTEGER NOT NULL REFERENCES weekly_timers(id) ON DELETE CASCADE,
  con_port_id INTEGER NOT NULL REFERENCES con_ports(id) ON DELETE CASCADE,
  cpu_port_id INTEGER NOT NULL REFERENCES cpu_ports(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weekly_timer_kwm_connections (
  id INTEGER PRIMARY KEY,
  weekly_timer_id INTEGER NOT NULL REFERENCES weekly_timers(id) ON DELETE CASCADE,
  con_port_id INTEGER NOT NULL REFERENCES con_ports(id) ON DELETE CASCADE,
  cpu_port_id INTEGER NOT NULL REFERENCES cpu_ports(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weekly_timer_default_states (
  id INTEGER PRIMARY KEY,
  weekly_timer_id INTEGER NOT NULL REFERENCES weekly_timers(id) ON DELETE CASCADE,
  default_state_id INTEGER NOT NULL REFERENCES default_states(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS con_groups (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  matrix_id INTEGER NOT NULL REFERENCES matrices(id) ON DELETE CASCADE,
  use_all_cpu_ports INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS con_group_ports (
  con_group_id INTEGER NOT NULL REFERENCES con_groups(id) ON DELETE CASCADE,
  con_port_id INTEGER NOT NULL REFERENCES con_ports(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (con_group_id, con_port_id)
);

CREATE TABLE IF NOT EXISTS con_group_cpu_ports (
  con_group_id INTEGER NOT NULL REFERENCES con_groups(id) ON DELETE CASCADE,
  cpu_port_id INTEGER NOT NULL REFERENCES cpu_ports(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (con_group_id, cpu_port_id)
);

CREATE TABLE IF NOT EXISTS rest_api_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS audit_logs (
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

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL DEFAULT '',
  login_count INTEGER NOT NULL DEFAULT 0,
  last_login_ip TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS auth_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_con_ports_matrix ON con_ports(matrix_id);
CREATE INDEX IF NOT EXISTS idx_cpu_ports_matrix ON cpu_ports(matrix_id);
CREATE INDEX IF NOT EXISTS idx_diagram_screens_diagram ON diagram_screens(diagram_id);
CREATE INDEX IF NOT EXISTS idx_default_states_matrix ON default_states(matrix_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);

INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES
  (1, datetime('now')),
  (2, datetime('now')),
  (3, datetime('now')),
  (4, datetime('now')),
  (5, datetime('now')),
  (6, datetime('now'));

COMMIT;
