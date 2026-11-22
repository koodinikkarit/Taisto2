"use strict";

const fs = require("node:fs/promises");
const { createHash } = require("node:crypto");
const { ARCHIVE_MAGIC } = require("./snapshot.cjs");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE = "https://www.googleapis.com";
const FILES = DRIVE + "/drive/v3/files/";
const UPLOAD_PATH = "/upload/drive/v3/files";
const ID = /^[A-Za-z0-9_-]{1,256}$/;
const FOLDER = "application/vnd.google-apps.folder";
const TYPE = "application/octet-stream";

// Do not pass Google's response body, request headers, session URL or local
// credential path on to the caller (errors can be surfaced in the audit log).
async function request(fetchImpl, url, init, stage, timeout = 30000) {
  let response;
  try {
    response = await fetchImpl(url, { ...init, redirect: "error", signal: AbortSignal.timeout(timeout) });
  } catch {
    throw new Error("Google Drive: " + stage + " failed");
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    throw new Error("Google Drive: " + stage + " failed (HTTP " + Number(response.status) + ")");
  }
  return response;
}

async function json(response, stage) {
  try { return await response.json(); } catch { throw new Error("Google Drive: invalid " + stage + " response"); }
}

async function refresh(oauthPath, fetchImpl) {
  let credentials;
  try {
    const file = await fs.open(oauthPath, "r");
    try {
      const stat = await file.stat();
      if (!stat.isFile() || stat.size > 64 * 1024) throw new Error();
      credentials = JSON.parse(await file.readFile("utf8"));
    } finally { await file.close(); }
    for (const key of ["client_id", "client_secret", "refresh_token"]) {
      if (typeof credentials[key] !== "string" || !credentials[key].trim()) throw new Error();
    }
  } catch { throw new Error("Google Drive: invalid OAuth credentials file"); }
  const { client_id, client_secret, refresh_token } = credentials;
  const body = new URLSearchParams({ client_id, client_secret, refresh_token, grant_type: "refresh_token" });
  const response = await request(fetchImpl, TOKEN_URL, { method: "POST", body }, "authentication");
  const token = await json(response, "authentication");
  if (typeof token?.access_token !== "string" || !/^[\x21-\x7e]+$/.test(token.access_token)) {
    throw new Error("Google Drive: missing access token");
  }
  return { Authorization: "Bearer " + token.access_token };
}

async function verifyFolder(folderId, headers, fetchImpl) {
  const url = new URL(FILES + folderId);
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("fields", "id,mimeType,trashed,capabilities(canAddChildren)");
  const folder = await json(await request(fetchImpl, url, { headers }, "folder lookup"), "folder lookup");
  if (folder?.id !== folderId || folder.mimeType !== FOLDER || folder.trashed !== false || folder.capabilities?.canAddChildren !== true) {
    throw new Error("Google Drive: destination must be a writable, non-trashed folder");
  }
  const acl = new URL(FILES + folderId + "/permissions");
  acl.searchParams.set("supportsAllDrives", "true");
  acl.searchParams.set("fields", "nextPageToken,permissions(type)");
  acl.searchParams.set("pageSize", "100");
  const seen = new Set();
  let permissionCount = 0;
  for (;;) {
    const page = await json(await request(fetchImpl, acl, { headers }, "folder permissions"), "folder permissions");
    if (!Array.isArray(page?.permissions) || page.permissions.some(p => !["group", "domain", "user"].includes(p?.type))) {
      throw new Error("Google Drive: public or unverifiable folder permissions");
    }
    permissionCount += page.permissions.length;
    if (page.nextPageToken == null) {
      if (!permissionCount) throw new Error("Google Drive: unverifiable folder permissions");
      return;
    }
    if (typeof page.nextPageToken !== "string" || !page.nextPageToken || seen.has(page.nextPageToken)) {
      throw new Error("Google Drive: unverifiable folder permissions");
    }
    seen.add(page.nextPageToken);
    acl.searchParams.set("pageToken", page.nextPageToken);
  }
}

async function uploadBackup({ filePath, filename, folderId, oauthPath, fetchImpl = fetch }) {
  if (typeof folderId !== "string" || !ID.test(folderId) || folderId === "root") throw new Error("Google Drive: invalid destination folder ID");
  if (typeof filename !== "string" || filename.length > 200 || !/^[\w.-]+\.enc$/.test(filename)) throw new Error("Google Drive: invalid backup filename");
  const file = await fs.open(filePath, "r");
  let stream;
  try {
    const stat = await file.stat();
    const magic = Buffer.alloc(ARCHIVE_MAGIC.length);
    if (!stat.isFile() || stat.size <= magic.length + 28 || (await file.read(magic, 0, magic.length, 0)).bytesRead !== magic.length || !magic.equals(ARCHIVE_MAGIC)) {
      throw new Error("Google Drive: expected an encrypted Taisto backup");
    }
    const headers = await refresh(oauthPath, fetchImpl);
    await verifyFolder(folderId, headers, fetchImpl);
    const init = await request(fetchImpl, DRIVE + UPLOAD_PATH + "?uploadType=resumable&supportsAllDrives=true&fields=id", {
      method: "POST", headers: { ...headers, "Content-Type": "application/json", "X-Upload-Content-Type": TYPE, "X-Upload-Content-Length": String(stat.size) },
      body: JSON.stringify({ name: filename, parents: [folderId], mimeType: TYPE })
    }, "upload setup");
    const location = init.headers.get("location");
    await init.body?.cancel().catch(() => {});
    let session;
    try { session = new URL(location); } catch { /* Fail closed below. */ }
    if (session?.origin !== DRIVE || session.pathname !== UPLOAD_PATH || session.username || session.password || session.hash || !session.searchParams.has("upload_id")) {
      throw new Error("Google Drive: invalid upload session");
    }
    const hash = createHash("md5");
    let bytes = 0;
    stream = file.createReadStream({ start: 0, autoClose: false });
    async function* encryptedBytes() {
      for await (const chunk of stream) { bytes += chunk.length; hash.update(chunk); yield chunk; }
    }
    const finished = await request(fetchImpl, session, {
      method: "PUT", headers: { ...headers, "Content-Type": TYPE, "Content-Length": String(stat.size) },
      body: encryptedBytes(), duplex: "half"
    }, "upload", 30 * 60 * 1000);
    const uploaded = await json(finished, "upload");
    if (bytes !== stat.size || typeof uploaded?.id !== "string" || !ID.test(uploaded.id)) throw new Error("Google Drive: incomplete upload");
    const check = new URL(FILES + uploaded.id);
    check.searchParams.set("supportsAllDrives", "true");
    check.searchParams.set("fields", "id,name,size,md5Checksum,parents,trashed");
    const stored = await json(await request(fetchImpl, check, { headers }, "verification"), "verification");
    if (stored?.id !== uploaded.id || stored.name !== filename || stored.trashed !== false || String(stored.size) !== String(bytes) ||
        stored.md5Checksum !== hash.digest("hex") || !Array.isArray(stored.parents) || stored.parents.length !== 1 || stored.parents[0] !== folderId) {
      throw new Error("Google Drive: uploaded backup verification failed");
    }
    return { id: uploaded.id, size: bytes };
  } finally {
    stream?.destroy();
    await file.close();
  }
}

module.exports = { uploadBackup };
