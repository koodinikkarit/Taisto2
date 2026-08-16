import crypto from "crypto";
import {
  authenticateUser,
  countAdminUsers,
  countUsers,
  getAuthSessionSecret,
  getUserById
} from "./storage/SqliteStorage";

const ENVIRONMENT_USER = process.env.TAISTO_USER || "taisto";
const ENVIRONMENT_PASSWORD = process.env.TAISTO_PASSWORD || "";
export const sessionCookieName = "taisto_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export function credentialsMatch(value, expected) {
  const valueBuffer = Buffer.from(String(value || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));
  return valueBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

export function isAuthenticationRequired() {
  return countUsers() > 0 || Boolean(ENVIRONMENT_PASSWORD);
}

export function usesDatabaseUsers() {
  return countUsers() > 0;
}

export function defaultLoginUsername() {
  return usesDatabaseUsers() && !(countAdminUsers() === 0 && ENVIRONMENT_PASSWORD) ? "" : ENVIRONMENT_USER;
}

function sessionSignature(payload) {
  return crypto.createHmac("sha256", getAuthSessionSecret()).update(payload).digest("base64url");
}

export function createSessionToken(identity, expiresAt = Date.now() + SESSION_DURATION_MS) {
  const payload = Buffer.from(JSON.stringify({
    id: identity.id == null ? "" : String(identity.id),
    username: identity.username,
    role: identity.role,
    source: identity.source,
    expiresAt
  })).toString("base64url");
  return `${payload}.${sessionSignature(payload)}`;
}

function sessionCookie(req) {
  const cookieHeader = typeof req.get === "function" ? req.get("cookie") : req.headers && req.headers.cookie;
  return (cookieHeader || "")
    .split(";")
    .map(value => value.trim())
    .find(value => value.startsWith(`${sessionCookieName}=`));
}

export function getSessionIdentity(req) {
  try {
    const cookie = sessionCookie(req);
    if (!cookie) return null;
    const token = cookie.slice(sessionCookieName.length + 1);
    const separator = token.lastIndexOf(".");
    if (separator < 1) return null;
    const payload = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    if (!credentialsMatch(signature, sessionSignature(payload))) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.expiresAt || Number(session.expiresAt) <= Date.now()) return null;
    if (session.source === "database") {
      const user = getUserById(session.id);
      if (!user) return null;
      return Object.assign({}, user, { source: "database", expiresAt: Number(session.expiresAt) });
    }
    if (session.source === "environment" && session.username) {
      return { id: "environment", username: session.username, role: "admin", source: "environment", expiresAt: Number(session.expiresAt) };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function getRequestAuthorization(req) {
  const identity = getSessionIdentity(req);
  if (identity) return Object.assign({ required: true, authenticated: true }, identity);
  if (!isAuthenticationRequired()) return {
    required: false,
    authenticated: true,
    id: "",
    username: "",
    role: "anonymous",
    source: "anonymous",
    expiresAt: null
  };
  return { required: true, authenticated: false, id: "", username: "", role: "anonymous", source: "anonymous", expiresAt: null };
}

export function authenticateCredentials(username, password) {
  if (usesDatabaseUsers()) {
    const user = authenticateUser(username, password);
    if (user) return Object.assign({}, user, { source: "database" });
    if (countAdminUsers() > 0 || !ENVIRONMENT_PASSWORD) return null;
  }
  if (!ENVIRONMENT_PASSWORD) return { id: "", username: "", role: "anonymous", source: "anonymous" };
  const candidateUsername = String(username || ENVIRONMENT_USER);
  if (!credentialsMatch(candidateUsername, ENVIRONMENT_USER) || !credentialsMatch(password, ENVIRONMENT_PASSWORD)) return null;
  return { id: "environment", username: ENVIRONMENT_USER, role: "admin", source: "environment" };
}

export function authenticateBasicHeader(header) {
  try {
    const encoded = String(header || "").startsWith("Basic ") ? String(header).slice(6) : "";
    if (!encoded) return null;
    const credentials = Buffer.from(encoded, "base64").toString("utf8");
    const separator = credentials.indexOf(":");
    if (separator < 0) return null;
    return authenticateCredentials(credentials.slice(0, separator), credentials.slice(separator + 1));
  } catch (error) {
    return null;
  }
}

export function sessionCookieHeader(identity, secure = false) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  return {
    value: `${sessionCookieName}=${createSessionToken(identity, expiresAt)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_MS / 1000}${secure ? "; Secure" : ""}`,
    expiresAt
  };
}

export function expiredSessionCookieHeader(secure = false) {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;
}
