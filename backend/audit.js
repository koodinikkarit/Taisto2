import { appendAuditLog } from "./storage/SqliteStorage";

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
  if (!/^\s*mutation\b/i.test(query)) return null;
  const match = query.match(/^\s*mutation(?:\s+\w+)?(?:\s*\([^)]*\))?\s*\{\s*(\w+)/is);
  return `graphql.${match ? match[1] : (req.body.operationName || "mutation")}`;
}

function restAction(req) {
  const parts = req.path.split("/").filter(Boolean);
  if (parts[0] === "rest") parts.shift();
  const resource = parts[0] || "request";
  if (parts[parts.length - 1] === "execute") return `${resource}.execute`;
  const operation = { POST: "create", PATCH: "update", PUT: "replace", DELETE: "delete" }[req.method] || req.method.toLowerCase();
  return `${resource}.${operation}`;
}

function settingsAction(req) {
  if (req.path.includes("/users")) {
    if (req.method === "POST") return "user.create";
    if (req.method === "PATCH") return "user.update";
    if (req.method === "DELETE") return "user.delete";
  }
  if (req.path.includes("/anonymous")) return req.method === "DELETE" ? "api_access.anonymous_disable" : "api_access.anonymous_enable";
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
        let action = null;
        if (originalPath.startsWith("/rest")) action = restAction(req);
        else if (originalPath === "/api") action = graphqlAction(req);
        else if (originalPath.startsWith("/settings/api-key") || originalPath.startsWith("/settings/users")) action = settingsAction(req);
        else if (originalPath === "/login") action = "authentication.login";
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
        const safeBody = sanitize(req.body || {});
        if (originalPath === "/api" && safeBody.query) safeBody.query = `[${action}]`;
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
