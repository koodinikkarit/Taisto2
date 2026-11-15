import assert from "assert";
import { EventEmitter } from "events";
import fs from "fs";
import os from "os";
import path from "path";
import { graphql, GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLBoolean } from "graphql";
import { getGraphqlOperation, requiresGraphqlAdmin } from "../backend/graphql/operation";
import { auditHttpMutations } from "../backend/audit";
import { initializeDatabaseStorage, listAuditLogs, closeDatabaseStorage } from "../backend/storage/SqliteStorage";

const inspect = (query, operationName) => getGraphqlOperation(query, operationName);
const attack = 'mutation { ...Outer } fragment Outer on MutationType { ... on MutationType { ...Inner } } fragment Inner on MutationType { alias: removeMatrix }';
const allowed = 'mutation { ...F } fragment F on MutationType { executeConGroup }';
assert.strictEqual(requiresGraphqlAdmin(inspect(attack)), true);
assert.strictEqual(requiresGraphqlAdmin(inspect(allowed)), false);
assert.strictEqual(requiresGraphqlAdmin(inspect('mutation { executeConGroup ... on MutationType { removeMatrix } }')), true);
assert.strictEqual(requiresGraphqlAdmin(inspect('mutation { ...Missing }')), true);
assert.strictEqual(requiresGraphqlAdmin(inspect('mutation { ...F } fragment F on MutationType { ...F }')), true);
const multi = 'query View { ping } mutation Edit { removeMatrix } mutation Run { executeConGroup }';
assert.strictEqual(requiresGraphqlAdmin(inspect(multi, 'Edit')), true);
assert.strictEqual(requiresGraphqlAdmin(inspect(multi, 'Run')), false);
assert.strictEqual(inspect(multi), null);

let removed = false;
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({ name: 'QueryType', fields: { ping: { type: GraphQLString } } }),
  mutation: new GraphQLObjectType({ name: 'MutationType', fields: {
    removeMatrix: { type: GraphQLBoolean, resolve: () => { removed = true; return true; } },
    executeConGroup: { type: GraphQLBoolean, resolve: () => true }
  } })
});

async function run() {
  // The malicious document is valid GraphQL and reaches the resolver without the guard.
  const result = await graphql({ schema, source: attack });
  assert.strictEqual(result.errors, undefined);
  assert.strictEqual(removed, true);
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'taisto-graphql-security-'));
  try {
    initializeDatabaseStorage({ sqlitePath: path.join(temporaryDirectory, 'taisto.sqlite') });
    const audit = auditHttpMutations();
    const log = (query, operationName, endpoint = '/api') => {
      const req = { method: 'POST', originalUrl: endpoint, path: endpoint, body: { query, operationName }, ip: '127.0.0.1' };
      const res = new EventEmitter();
      res.statusCode = 200;
      audit(req, res, () => {});
      res.emit('finish');
    };
    log('# comment\nmutation { ...F } fragment F on MutationType { removeMatrix }');
    log(multi, 'Edit');
    log(multi, 'View');
    log(attack, undefined, '/api/');
    log(attack, undefined, '/API');
    log('mutation { executeConGroup removeMatrix }');
    const logs = listAuditLogs();
    assert.strictEqual(logs.total, 5);
    assert.strictEqual(logs.rows.filter(row => row.action === 'graphql.removeMatrix').length, 4);
    assert.ok(JSON.stringify(logs.rows).includes('executeConGroup'));
    assert.ok(JSON.stringify(logs.rows).includes('removeMatrix'));
    assert.ok(logs.rows.every(row => !JSON.stringify(row.details).includes('fragment F')));
    console.log('GraphQL authorization and audit tests passed');
  } finally {
    closeDatabaseStorage();
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
