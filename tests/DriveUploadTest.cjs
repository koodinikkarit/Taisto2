"use strict";
const assert = require("node:assert/strict");
const { mkdtemp, writeFile, rm } = require("node:fs/promises");
const { createHash } = require("node:crypto");
const os = require("node:os");
const path = require("node:path");
const { ARCHIVE_MAGIC } = require("../backend/drive/snapshot.cjs");
const { uploadBackup } = require("../backend/drive/upload.cjs");

async function test() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "taisto-drive-upload-test-"));
  const folderId = "test_folder";
  const fileId = "verified_file";
  const filename = "taisto-test.sqlite.enc";
  const token = "test-access-token";
  const refreshToken = "test-refresh-token";
  const credentials = { client_id: "test-client", client_secret: "test-secret", refresh_token: refreshToken };
  const archive = Buffer.concat([ARCHIVE_MAGIC, Buffer.alloc(150000, 0xff)]);
  const md5 = createHash("md5").update(archive).digest("hex");
  const filePath = path.join(dir, filename);
  const oauthPath = path.join(dir, "oauth.json");
  const base = "https://www.googleapis.com";
  const uploadPath = "/upload/drive/v3/files";
  const folder = { id: folderId, mimeType: "application/vnd.google-apps.folder", capabilities: { canAddChildren: true }, trashed: false };
  const stored = { id: fileId, name: filename, parents: [folderId], size: String(archive.length), md5Checksum: md5, trashed: false };
  function fake(options = {}) {
    const operations = [];
    const fetchImpl = async (address, init) => {
      const url = new URL(address);
      assert.equal(init.redirect, "error");
      if (url.href === "https://oauth2.googleapis.com/token") {
        operations.push("oauth");
        assert.equal(init.body.get("grant_type"), "refresh_token");
        assert.equal(init.body.get("refresh_token"), refreshToken);
        assert.equal(init.body.get("client_secret"), credentials.client_secret);
        assert.equal(init.method, "POST");
        return Response.json(options.badToken ? {} : { access_token: token });
      }
      assert.equal(url.origin, base);
      assert.equal(init.headers.Authorization, "Bearer " + token);
      if (url.pathname.endsWith("/permissions")) {
        const second = url.searchParams.get("pageToken") === "next";
        operations.push(second ? "acl2" : "acl1");
        if (!second) return Response.json({ permissions: [{ type: "user" }], nextPageToken: "next" });
        if (options.noACL) return Response.json({error: token}, { status: 403 });
        if (options.loop) return Response.json({permissions: [], nextPageToken: "next"});
        return Response.json({ permissions: [{ type: options.public ? "anyone" : "group" }] });
      }
      if (url.pathname === "/drive/v3/files/" + folderId) {
        operations.push("folder");
        return Response.json({ ...folder, ...options.folder });
      }
      if (url.pathname === uploadPath && init.method === "POST") {
        operations.push("init");
        assert.equal(url.searchParams.get("uploadType"), "resumable");
        const metadata = JSON.parse(init.body);
        assert.deepEqual(metadata.parents, [folderId]);
        assert.equal(metadata.name, filename);
        return new Response(null, { headers: { location: options.session || base + uploadPath + "?uploadType=resumable&upload_id=test-session" } });
      }
      if (url.pathname === uploadPath && init.method === "PUT") {
        operations.push("put");
        assert.equal(init.headers["Content-Length"], String(archive.length));
        assert.ok(init.body[Symbol.asyncIterator], "large backup must be streamed");
        const chunks = [];
        for await (const chunk of init.body) chunks.push(chunk);
        assert.deepEqual(Buffer.concat(chunks), archive);
        return Response.json({ id: fileId });
      }
      assert.equal(url.pathname, "/drive/v3/files/" + fileId);
      operations.push("verify");
      return Response.json({ ...stored, ...options.stored });
    };
    return { fetchImpl, operations };
  }
  try {
    await writeFile(oauthPath, JSON.stringify(credentials), { mode: 0o600 });
    await writeFile(filePath, archive);
    const request = {filePath, filename, folderId, oauthPath};
    const success = fake();
    assert.deepEqual(await uploadBackup({ ...request, fetchImpl: success.fetchImpl }), { id: fileId, size: archive.length });
    assert.deepEqual(success.operations, ["oauth", "folder", "acl1", "acl2", "init", "put", "verify"]);
    for (const options of [{badToken:true}, {folder:{trashed:true}}, {folder:{capabilities:{canAddChildren:false}}}, {public:true}, {loop:true}, {noACL:true},
      {session:"https://not-google.invalid/upload/drive/v3/files?upload_id=stolen"}, {session:base + "/not-drive?upload_id=bad"}]) {
      const mocked = fake(options);
      await assert.rejects(uploadBackup({ ...request, fetchImpl: mocked.fetchImpl }), error => {
        assert.ok(!error.message.includes(token) && !error.message.includes(refreshToken));
        return /^Google Drive:/.test(error.message);
      });
      assert.ok(!mocked.operations.includes("put"));
    }
    for (const invalid of [{size: "1"}, {name: "other"}, {md5Checksum: "wrong"}, {parents: ["foreign_folder"]}, {trashed:true}]) {
      await assert.rejects(uploadBackup({ ...request, fetchImpl: fake({stored: invalid}).fetchImpl }), /verification failed/);
    }
    await writeFile(filePath, Buffer.alloc(512)); // not a Taisto encrypted snapshot
    const guarded = fake();
    await assert.rejects(uploadBackup({ ...request, fetchImpl: guarded.fetchImpl }), /expected an encrypted/);
    assert.equal(guarded.operations.length, 0);
    console.log("Drive upload, destination safety and integrity tests passed");
  } finally { await rm(dir, {recursive: true, force: true}); }
}
test().catch(error => { console.error(error); process.exitCode = 1; });
