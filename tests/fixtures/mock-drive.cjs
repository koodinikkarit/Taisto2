"use strict";
// Preload in the temporary Taisto process only. Never forward an HTTP request.
const { createHash } = require("node:crypto");
const { ARCHIVE_MAGIC } = require("../../backend/drive/snapshot.cjs");
const folder = "test-destination";
const upload = "/upload/drive/v3/files";
let name, size, md5;
globalThis.fetch = async (address, init) => {
  const url = new URL(address);
  if (url.href === "https://oauth2.googleapis.com/token" && init.method === "POST" &&
      init.body.get("refresh_token") === "fake-private-refresh") return Response.json({ access_token: "fake-private-access" });
  if (url.origin !== "https://www.googleapis.com" || init.headers.Authorization !== "Bearer fake-private-access") throw Error("unexpected destination");
  if (url.pathname === "/drive/v3/files/" + folder) return Response.json({
    id: folder, trashed: false, mimeType: "application/vnd.google-apps.folder", capabilities: { canAddChildren: true }
  });
  if (url.pathname === "/drive/v3/files/" + folder + "/permissions") return Response.json({ permissions: [{type: "user"}] });
  if (url.pathname === upload && init.method === "POST") {
    const metadata = JSON.parse(init.body);
    if (metadata.parents[0] !== folder) throw Error("unexpected upload parent");
    name = metadata.name;
    return new Response(null, { headers: { location: url.origin + upload + "?upload_id=test" } });
  }
  if (url.pathname === upload && url.searchParams.get("upload_id") === "test" && init.method === "PUT") {
    const chunks = [];
    for await (const chunk of init.body) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    if (!bytes.subarray(0, ARCHIVE_MAGIC.length).equals(ARCHIVE_MAGIC) || bytes.length < 4096) throw Error("not an encrypted database snapshot");
    size = String(bytes.length);
    md5 = createHash("md5").update(bytes).digest("hex");
    return Response.json({ id: "test-backup-id" });
  }
  if (url.pathname === "/drive/v3/files/test-backup-id" && md5) {
    return Response.json({ id: "test-backup-id", name, size, md5Checksum: md5, parents: [folder], trashed: false });
  }
  throw Error("unexpected test request");
};
