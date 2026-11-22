const { parseArgs } = require('node:util');
const { restoreBackup } = require('../backend/drive/snapshot.cjs');

const usage = 'Usage: node scripts/restore-drive-backup.cjs --archive FILE --key FILE --output NEW_SQLITE';

async function main() {
  const { values } = parseArgs({ options: {
    archive: { type: 'string' }, key: { type: 'string' }, output: { type: 'string' }, help: { type: 'boolean' }
  } });
  if (values.help) { console.log(usage); return; }
  if (!values.archive || !values.key || !values.output) throw new Error(usage);
  await restoreBackup({ archivePath: values.archive, keyPath: values.key, outputPath: values.output });
  console.log('SQLite backup authenticated, checked and restored to the new output file.');
}

main().catch(error => { console.error('Restore failed:', error.message); process.exitCode = 1; });
