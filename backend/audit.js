import { appendAuditLog } from "./storage/SqliteStorage";
import { getGraphqlOperation } from "./graphql/operation";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const REDACTED_FIELD = /password|secret|token|authorization|api.?key|(^|_)key$/i;

function sanitize(value, depth = 0) {
  if (depth > 5) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 100).map(item => sanitize(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.keys(value).slice(0, 100).reduce((result, key) => {
      result[key] = REDACTED_FIELD.test(key) ? "[redacted]" : sanitize(value[key], depth + 1);
      return result;
    }, {});
  }
  if (typeof value === "string") return value.slice(0, 1000);
  return value;
}

function graphqlAction(req) {
  const query = req.body && typeof req.body.query === "string" ? req.body.query : "";
  const operation = getGraphqlOperation(query, req.body && req.body.operationName);
  if (!operation || operation.operation !== "mutation") return null;
  return `graphql.${operation.fields[0] || "mutation"}`;
}

function restAction(req) {
  const parts = req.path.toLowerCase().split("/").filter(Boolean);
  if (parts[0] === "rest") parts.shift();
  const resource = parts[0] || "request";
  if (parts[parts.length - 1] === "execute") return `${resource}.execute`;
  const operation = { POST: "create", PATCH: "update", PUT: "replace", DELETE: "delete" }[req.method] || req.method.toLowerCase();
  return `${resource}.${operation}`;
}

function settingsAction(req) {
  const path = req.path.toLowerCase();
  if (path.includes("/telegram")) return "telegram.settings_update";
  if (path.includes("/users")) {
    if (req.method === "POST") return "user.create";
    if (req.method === "PATCH") return "user.update";
    if (req.method === "DELETE") return "user.delete";
  }
  if (path.includes("/anonymous")) return req.method === "DELETE" ? "api_access.anonymous_disable" : "api_access.anonymous_enable";
  if (req.method === "POST") return "api_key.create";
  if (req.method === "PATCH") return "api_key.update";
  if (req.method === "DELETE") return "api_key.delete";
  return `settings.${req.method.toLowerCase()}`;
}

export function auditHttpMutations({ getSessionIdentity } = {}) {
  return (req, res, next) => {
    res.on("finish", () => {
      try {
        if (SAFE_METHODS.has(req.method)) return;
        const originalPath = (req.originalUrl || req.path || "").split("?")[0];
        const isGraphqlPath = /^\/api\/?$/i.test(originalPath);
        let action = null;
        if (/^\/rest(?:\/|$)/i.test(originalPath)) action = restAction(req);
        else if (isGraphqlPath) action = graphqlAction(req);
        else if (/^\/settings\/(?:api-key|users|telegram)(?:\/|$)/i.test(originalPath)) action = settingsAction(req);
        else if (/^\/login\/?$/i.test(originalPath)) action = "authentication.login";
        if (!action) return;

        const identity = getSessionIdentity ? getSessionIdentity(req) : null;
        const actor = req.auditActor || (identity ? {
          type: "user",
          id: String(identity.id || ""),
          name: identity.username
        } : {
          type: "web",
          id: "",
          name: "Taisto web client"
        });
        const safeBody = action === "telegram.settings_update"
          ? { enabled: Boolean(req.body && req.body.enabled), auditEnabled: Boolean(req.body && req.body.auditEnabled), tokenProvided: Boolean(req.body && req.body.token) }
          : sanitize(req.body || {});
        if (isGraphqlPath && safeBody.query) {
          const operation = getGraphqlOperation(req.body.query, req.body.operationName);
          safeBody.query = `[${action}]`;
          if (operation) safeBody.graphqlFields = operation.fields;
        }
        appendAuditLog({
          actorType: actor.type,
          actorId: actor.id,
          actorName: actor.name,
          action,
          target: originalPath,
          method: req.method,
          path: originalPath,
          statusCode: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 400,
          ipAddress: req.ip || (req.socket && req.socket.remoteAddress) || "",
          details: { body: safeBody }
        });
      } catch (error) {
        console.error("Audit log write failed", error);
      }
    });
    next();
  };
}
