const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { execFileSync } = require('node:child_process');
const { mock } = require('node:test');
const { withEncryptedSnapshot, restoreBackup, ARCHIVE_MAGIC } = require('../backend/drive/snapshot.cjs');

async function main() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'taisto-drive-snapshot-test-'));
  const file = name => path.join(dir, name);
  const sqlitePath = file('live.sqlite'), keyPath = file('test.key');
  const archivePath = file('saved.sqlite.enc'), outputPath = file('restored.sqlite');
  const options = { sqlitePath, keyPath }, recovery = { archivePath, keyPath, outputPath };
  const secret = 'audit and user data that must not be in plaintext on Drive';
  let db;
  try {
    await fs.writeFile(keyPath, crypto.randomBytes(32), { mode: 0o600 });
    db = new DatabaseSync(sqlitePath);
    db.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE audit(event TEXT); PRAGMA wal_checkpoint(TRUNCATE)');
    db.prepare('INSERT INTO audit VALUES (?)').run(secret);
    assert.ok((await fs.stat(sqlitePath + '-wal')).size > 0, 'test requires committed data in WAL');
    const reserve = 256n * 1024n * 1024n;
    const overhead = BigInt(ARCHIVE_MAGIC.length + 12 + 16);
    const databaseBytes = (await fs.stat(sqlitePath, { bigint: true })).size;
    let available = reserve + 2n * databaseBytes + overhead; // fits DB alone, not the uncheckpointed WAL
    const free = mock.method(fs, 'statfs', async () => ({ bavail: available, frsize: 1n, bsize: 4096n }));
    try {
      await assert.rejects(withEncryptedSnapshot(options, () => assert.fail()), /Insufficient free disk/);
      assert.equal(free.mock.callCount(), 1, 'check source DB + WAL before the snapshot');
      free.mock.mockImplementationOnce(async () => ({ bavail: 10n ** 12n, bsize: 1n }), 1);
      available = reserve; // another process consumed the extra space during backup
      await assert.rejects(withEncryptedSnapshot(options, () => assert.fail()), /Insufficient free disk/);
      assert.equal(free.mock.callCount(), 3, 'recheck before encrypting');
    } finally { free.mock.restore(); }
    let tempDir;
    const result = await withEncryptedSnapshot(options, async encrypted => {
      tempDir = path.dirname(encrypted);
      assert.deepEqual(await fs.readdir(tempDir), [path.basename(encrypted)], 'only ciphertext remains during upload');
      if (process.platform !== 'win32') {
        assert.equal((await fs.stat(tempDir)).mode & 0o777, 0o700);
        assert.equal((await fs.stat(encrypted)).mode & 0o777, 0o600);
      }
      await fs.copyFile(encrypted, archivePath);
      return 'uploaded';
    });
    assert.equal(result, 'uploaded');
    await assert.rejects(fs.stat(tempDir), { code: 'ENOENT' });
    const encrypted = await fs.readFile(archivePath);
    assert.ok(encrypted.subarray(0, ARCHIVE_MAGIC.length).equals(ARCHIVE_MAGIC));
    assert.ok(!encrypted.includes(secret));
    await assert.rejects(withEncryptedSnapshot(options, async second => {
      tempDir = path.dirname(second);
      assert.notDeepEqual(encrypted, await fs.readFile(second), 'independent snapshots must use fresh IVs');
      throw new Error('simulated upload failure');
    }), /simulated upload failure/);
    await assert.rejects(fs.stat(tempDir), { code: 'ENOENT' });

    await restoreBackup(recovery);
    const restored = new DatabaseSync(outputPath, { readOnly: true });
    try { assert.equal(restored.prepare('SELECT event FROM audit').get().event, secret); }
    finally { restored.close(); }
    if (process.platform !== 'win32') assert.equal((await fs.stat(outputPath)).mode & 0o777, 0o600);
    await assert.rejects(restoreBackup(recovery), /requires a new/);
    const cliOut = file('restored-cli.sqlite');
    execFileSync(process.execPath, [path.resolve(__dirname, '../scripts/restore-drive-backup.cjs'),
      '--archive', archivePath, '--key', keyPath, '--output', cliOut], { timeout: 15000, stdio: 'pipe' });
    assert.deepEqual(await fs.readFile(cliOut), await fs.readFile(outputPath));
    const fresh = file('fresh.sqlite');
    const noRoom = mock.method(fs, 'statfs', async () => ({ bavail: reserve, bsize: 1n }));
    try { await assert.rejects(restoreBackup({ ...recovery, outputPath: fresh }), /Insufficient free disk/); }
    finally { noRoom.mock.restore(); }
    await assert.rejects(fs.stat(fresh), { code: 'ENOENT' });
    await fs.writeFile(fresh + '-wal', 'orphaned wal must never be reused');
    await assert.rejects(restoreBackup({ ...recovery, outputPath: fresh }), /sidecars/);
    await fs.unlink(fresh + '-wal');
    const wrongKey = file('wrong.key');
    await fs.writeFile(wrongKey, crypto.randomBytes(32));
    await assert.rejects(restoreBackup({ ...recovery, keyPath: wrongKey, outputPath: fresh }));
    await assert.rejects(fs.stat(fresh), { code: 'ENOENT' });
    for (const position of [0, ARCHIVE_MAGIC.length, ARCHIVE_MAGIC.length + 13, encrypted.length - 1]) {
      const damaged = Buffer.from(encrypted);
      damaged[position] ^= 0xff;
      const corrupted = file('damaged.enc');
      await fs.writeFile(corrupted, damaged);
      await assert.rejects(restoreBackup({ ...recovery, archivePath: corrupted, outputPath: fresh }));
      await assert.rejects(fs.stat(fresh), { code: 'ENOENT' });
    }
    // Even authenticated bytes must pass SQLite verification before publishing.
    const iv = crypto.randomBytes(12), header = Buffer.concat([ARCHIVE_MAGIC, iv]);
    const cipher = crypto.createCipheriv('aes-256-gcm', await fs.readFile(keyPath), iv);
    cipher.setAAD(header);
    await fs.writeFile(file('not-db.enc'), Buffer.concat([header, cipher.update(Buffer.alloc(1024, 65)), cipher.final(), cipher.getAuthTag()]));
    await assert.rejects(restoreBackup({ ...recovery, archivePath: file('not-db.enc'), outputPath: fresh }));
    await assert.rejects(fs.stat(fresh), { code: 'ENOENT' });
    assert.ok(!(await fs.readdir(dir)).some(name => name.startsWith('.taisto-drive-')), 'remove all partially decrypted staging files');
    await fs.writeFile(wrongKey, 'short');
    await assert.rejects(withEncryptedSnapshot({ ...options, keyPath: wrongKey }, () => assert.fail()), /32 raw bytes/);
    await fs.writeFile(file('bad.sqlite'), Buffer.alloc(1024, 65));
    await assert.rejects(withEncryptedSnapshot({ ...options, sqlitePath: file('bad.sqlite') }, () => assert.fail()));
  } finally {
    if (db) db.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
  console.log('Drive snapshot and offline restore tests passed');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
