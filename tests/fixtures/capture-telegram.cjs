// Preloaded only in the isolated integration-test server. No request leaves it.
globalThis.fetch = async (url, options) => {
  const endpoint = new URL(url);
  if (endpoint.origin !== "https://api.telegram.org" || !endpoint.pathname.endsWith("/sendMessage")) {
    throw new Error("Unexpected outbound request in audit-only test");
  }
  const { chat_id, text } = JSON.parse(options.body);
  process.send({ chat_id, text });
  return Response.json({ ok: true, result: {} });
};
