import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { withEncryptedSnapshot } from "./snapshot.cjs";
import { uploadBackup } from "./upload.cjs";
import * as sqlite from "../storage/SqliteStorage";

const localClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Helsinki", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit"
});
const retryAfter = 15 * 60 * 1000;
function helsinki(date) {
  const parts = Object.fromEntries(localClock.formatToParts(date).map(({ type, value }) => [type, value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}
function readable(file) {
  try { fs.accessSync(file, fs.constants.R_OK); return fs.statSync(file).isFile(); } catch { return false; }
}
export class BackupRequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function createDriveBackupService({
  store = sqlite, snapshot = withEncryptedSnapshot, upload = uploadBackup, now = () => new Date(),
  oauthPath = process.env.BACKUP_OAUTH_FILE, keyPath = process.env.BACKUP_KEY_FILE
} = {}) {
  let active = null, timer = null;
  const secretStatus = () => ({ credentialsConfigured: readable(oauthPath), keyConfigured: readable(keyPath) });
  function ready() {
    const files = secretStatus();
    return files.credentialsConfigured && files.keyConfigured;
  }
  function status() {
    const { lastSuccessDay, ...config } = store.getDriveBackupConfig();
    return { ...config, ...secretStatus(), running: Boolean(active), lastError: active ? "" : config.lastError };
  }
  function configure(input) {
    if (active) throw new BackupRequestError(409, "A backup is already running");
    if (!input || typeof input.enabled !== "boolean" || typeof input.folderId !== "string")
      throw new BackupRequestError(400, "Expected enabled and folderId");
    const folder = input.folderId.trim();
    if ((folder && (!/^[A-Za-z0-9_-]{1,200}$/.test(folder) || folder === "root")) || (input.enabled && !folder))
      throw new BackupRequestError(400, "Specify a Drive folder ID, not a URL or Drive root");
    if (input.enabled && !ready()) throw new BackupRequestError(409, "Configure the OAuth and encryption key files first");
    store.setDriveBackupConfig(input.enabled, folder);
    return status();
  }
  function run(actor = null) {
    if (active) throw new BackupRequestError(409, "A backup is already running");
    const { folderId } = store.getDriveBackupConfig();
    if (!folderId) throw new BackupRequestError(409, "Set a destination folder first");
    if (actor && !ready()) throw new BackupRequestError(409, "Configure the OAuth and encryption key files first");
    const start = now(), local = helsinki(start);
    const filename = `taisto-${start.toISOString().replace(/[:.]/g, "-")}-${randomUUID()}.sqlite.enc`;
    store.recordDriveBackupStart(start.toISOString());
    active = Promise.resolve().then(async () => {
      let problem = "Snapshot or encryption failed";
      try {
        if (!ready()) { problem = "OAuth or encryption key file unavailable"; throw new Error(); }
        await snapshot({ sqlitePath: store.getSqlitePath(), keyPath }, async filePath => {
          problem = "Drive upload or verification failed; check credentials and folder access";
          return upload({ filePath, filename, folderId, oauthPath });
        });
        problem = "";
      } catch { /* Do not persist paths, credentials, or Google error bodies. */ }
      store.recordDriveBackupResult({ error: problem, timestamp: now().toISOString(), day: local.hour >= 3 ? local.day : "", filename });
      store.appendAuditLog({
        actorType: actor ? "user" : "scheduler", actorName: actor ? actor.name : "Taisto (ajastus)",
        actorId: actor ? actor.id : "", ipAddress: actor ? actor.ip : "",
        action: "drive_backup.result", target: filename, method: "BACKUP", path: "",
        statusCode: problem ? 500 : 200, success: !problem, details: { trigger: actor ? "manual" : "scheduled" }
      });
    }).catch(() => console.error("Drive backup status or audit could not be recorded")).finally(() => { active = null; });
  }
  function tick() {
    if (active) return;
    const config = store.getDriveBackupConfig();
    if (!config.enabled) return;
    const date = now(), local = helsinki(date);
    if (local.hour < 3 || local.day === config.lastSuccessDay || (config.lastAttemptAt && date.getTime() - Date.parse(config.lastAttemptAt) < retryAfter)) return;
    run();
  }
  function safeTick() { try { tick(); } catch { console.error("Drive backup schedule could not be checked"); } }
  return {
    configure, status, run, tick,
    start() { if (!timer) { timer = setInterval(safeTick, 60000); timer.unref(); safeTick(); } },
    async stop() { clearInterval(timer); timer = null; await active; }
  };
}
