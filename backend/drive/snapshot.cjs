const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { pipeline } = require('node:stream/promises');
const { DatabaseSync, backup } = require('node:sqlite');
const { Worker, isMainThread, workerData } = require('node:worker_threads');

// Versioned wire format: magic | IV | ciphertext | GCM tag. Magic and IV
// together are the authenticated header; no credential is stored in it.
const ARCHIVE_MAGIC = Buffer.from('TAISTO-SQLITE\x01', 'ascii');
const IV_BYTES = 12;
const TAG_BYTES = 16;
const HEADER_BYTES = ARCHIVE_MAGIC.length + IV_BYTES;
const HEADROOM = 256n * 1024n * 1024n;

async function requireFreeSpace(directory, needed) {
  const stat = await fsp.statfs(directory, { bigint: true });
  // frsize is the unit of the block counts where supplied. Older Node 24
  // versions expose only bsize. Use space available to the current user.
  const available = stat.bavail * (stat.frsize || stat.bsize);
  if (available < needed + HEADROOM) throw new Error('Insufficient free disk space for backup or restore (256 MiB reserve required)');
}

async function estimateSnapshotSize(sqlitePath) {
  const db = await fsp.stat(sqlitePath, { bigint: true });
  if (!db.isFile() || db.size < 100n) throw new Error('Missing or empty SQLite database');
  try {
    // The WAL can contain newly added pages not yet present in the database
    // file. Counting the full WAL is deliberately a conservative upper bound.
    return db.size + (await fsp.stat(sqlitePath + '-wal', { bigint: true })).size;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return db.size;
  }
}

async function readExactly(handle, length, position) {
  const buffer = Buffer.alloc(length);
  for (let n = 0; n < length;) {
    const { bytesRead } = await handle.read(buffer, n, length - n, position + n);
    if (!bytesRead) throw new Error('Unexpected end of file');
    n += bytesRead;
  }
  return buffer;
}

async function readKey(keyPath) {
  const handle = await fsp.open(keyPath, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size !== 32) throw new Error('Backup key must contain exactly 32 raw bytes');
    return await readExactly(handle, 32, 0);
  } finally {
    await handle.close();
  }
}

async function withPrivateDirectory(parent, callback) {
  const dir = await fsp.mkdtemp(path.join(parent, '.taisto-drive-'));
  try {
    await fsp.chmod(dir, 0o700);
    return await callback(dir);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
}

function checkIntegrity(db) {
  const result = db.prepare('PRAGMA integrity_check(1)').get();
  if (!result || result.integrity_check !== 'ok') throw new Error('SQLite integrity check failed');
}

async function snapshotDatabase(sqlitePath, output) {
  const source = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    // Online backup reads the committed state, including uncheckpointed WAL.
    await backup(source, output);
  } finally {
    source.close();
  }
  const copy = new DatabaseSync(output);
  try {
    // The archive must restore as a standalone file, without WAL sidecars.
    copy.exec('PRAGMA journal_mode = DELETE');
    checkIntegrity(copy);
  } finally {
    copy.close();
  }
}

function runSnapshotWorker(sqlitePath, output) {
  // The synchronous integrity scan must not block live matrix control.
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, { workerData: { job: 'taisto-drive-snapshot', sqlitePath, output }, execArgv: [] });
    worker.once('error', reject);
    worker.once('exit', code => code === 0 ? resolve() : reject(new Error('SQLite snapshot worker failed')));
  });
}

async function withEncryptedSnapshot({ sqlitePath, keyPath }, callback) {
  const key = await readKey(keyPath);
  try {
    return await withPrivateDirectory(os.tmpdir(), async dir => {
      const plain = path.join(dir, 'snapshot.sqlite');
      const archive = path.join(dir, 'snapshot.sqlite.enc');
      const overhead = BigInt(HEADER_BYTES + TAG_BYTES);
      await requireFreeSpace(dir, 2n * await estimateSnapshotSize(sqlitePath) + overhead);
      await fsp.writeFile(plain, '', { flag: 'wx', mode: 0o600 });
      await runSnapshotWorker(sqlitePath, plain);
      // The live database (or other consumers of this disk) may have grown.
      await requireFreeSpace(dir, (await fsp.stat(plain, { bigint: true })).size + overhead);
      const iv = crypto.randomBytes(IV_BYTES);
      const header = Buffer.concat([ARCHIVE_MAGIC, iv]);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(header);
      await fsp.writeFile(archive, header, { flag: 'wx', mode: 0o600 });
      await pipeline(fs.createReadStream(plain), cipher, fs.createWriteStream(archive, { flags: 'a' }));
      await fsp.appendFile(archive, cipher.getAuthTag());
      await fsp.unlink(plain);
      return callback(archive);
    });
  } finally {
    key.fill(0);
  }
}

async function restoreBackup({ archivePath, keyPath, outputPath }) {
  const destination = path.resolve(outputPath);
  // Refuse existing destinations and orphaned sidecars. link() below also
  // prevents replacing a destination created while decryption was running.
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    try { await fsp.lstat(destination + suffix); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    throw new Error('Restore requires a new SQLite filename without existing sidecars');
  }
  const key = await readKey(keyPath);
  try {
    return await withPrivateDirectory(path.dirname(destination), async dir => {
      const stage = path.join(dir, 'restore.sqlite');
      const handle = await fsp.open(archivePath, 'r');
      try {
        const stat = await handle.stat();
        if (!stat.isFile() || stat.size < HEADER_BYTES + 100 + TAG_BYTES) throw new Error('Not a Taisto backup');
        const header = await readExactly(handle, HEADER_BYTES, 0);
        if (!header.subarray(0, ARCHIVE_MAGIC.length).equals(ARCHIVE_MAGIC)) throw new Error('Unsupported Taisto backup format');
        await requireFreeSpace(dir, BigInt(stat.size - HEADER_BYTES - TAG_BYTES));
        const tag = await readExactly(handle, TAG_BYTES, stat.size - TAG_BYTES);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, header.subarray(ARCHIVE_MAGIC.length), { authTagLength: TAG_BYTES });
        decipher.setAAD(header);
        decipher.setAuthTag(tag);
        await pipeline(handle.createReadStream({ start: HEADER_BYTES, end: stat.size - TAG_BYTES - 1, autoClose: false }),
          decipher, fs.createWriteStream(stage, { flags: 'wx', mode: 0o600 }));
      } finally {
        await handle.close();
      }
      // Only open authenticated plaintext as a database; never publish an
      // unverified or partial file to the operator's destination.
      const db = new DatabaseSync(stage, { readOnly: true });
      try { checkIntegrity(db); } finally { db.close(); }
      await fsp.link(stage, destination);
      return destination;
    });
  } finally {
    key.fill(0);
  }
}

if (!isMainThread && workerData && workerData.job === 'taisto-drive-snapshot') {
  snapshotDatabase(workerData.sqlitePath, workerData.output).catch(error => {
    // Report failure through the worker's error event, not via stdout/stderr.
    process.nextTick(() => { throw error; });
  });
}

module.exports = { ARCHIVE_MAGIC, withEncryptedSnapshot, restoreBackup };
