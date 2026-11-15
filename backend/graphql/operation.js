import { getOperationAST, parse } from "graphql";

// Resolve the same operation that graphql-http will execute, including root fragments.
export function getGraphqlOperation(query, operationName) {
  if (typeof query !== "string" || (operationName != null && typeof operationName !== "string")) return null;
  let document;
  try {
    document = parse(query);
  } catch (error) {
    // Invalid documents are rejected by graphql-http without execution.
    return null;
  }
  const operation = getOperationAST(document, operationName || undefined);
  if (!operation) return null;
  try {
    const fragments = new Map(document.definitions.filter(definition => definition.kind === "FragmentDefinition").map(fragment => [fragment.name.value, fragment]));
    const fields = [];
    let complete = true;
    const visitedFragments = new Set();
    const visit = (selectionSet, activeFragments) => {
      for (const selection of selectionSet.selections) {
        if (selection.kind === "Field") fields.push(selection.name.value);
        else if (selection.kind === "InlineFragment") visit(selection.selectionSet, activeFragments);
        else if (selection.kind === "FragmentSpread") {
          const name = selection.name.value;
          const fragment = fragments.get(name);
          if (!fragment || activeFragments.has(name)) { complete = false; continue; }
          if (visitedFragments.has(name)) continue;
          visitedFragments.add(name);
          const next = new Set(activeFragments);
          next.add(name);
          visit(fragment.selectionSet, next);
        } else complete = false;
      }
    };
    visit(operation.selectionSet, new Set());
    return { operation: operation.operation, fields, complete };
  } catch (error) {
    // A failed traversal must never make a mutation appear authorized.
    return { operation: operation.operation, fields: [], complete: false };
  }
}

const USER_GRAPHQL_MUTATIONS = new Set(["executeConGroup", "executeDefaultState"]);

export function requiresGraphqlAdmin(operation) {
  return Boolean(operation && operation.operation === "mutation" &&
    (!operation.complete || !operation.fields.length || operation.fields.some(field => !USER_GRAPHQL_MUTATIONS.has(field))));
}
