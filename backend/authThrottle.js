// Limits expensive credential checks, including HTTP Basic authentication.
export function createAuthThrottle({ windowMs = 60000, perAddress = 20, globalLimit = 200, maxConcurrent = 4, maxAddresses = 10000, now = () => Date.now() } = {}) {
  const addresses = new Map();
  let globalWindow = { start: now(), count: 0 };
  let active = 0;

  return (req, res, next) => {
    const authorization = req.get("authorization") || "";
    if (!(req.method === "POST" && /^\/login\/?$/i.test(req.path)) && !authorization.startsWith("Basic ")) return next();
    const time = now();
    if (time - globalWindow.start >= windowMs) globalWindow = { start: time, count: 0 };
    for (const [key, entry] of addresses) if (time - entry.start >= windowMs) addresses.delete(key);
    const address = req.ip || (req.socket && req.socket.remoteAddress) || "unknown";
    let entry = addresses.get(address);
    if (active >= maxConcurrent || globalWindow.count >= globalLimit || (entry && entry.count >= perAddress) || (!entry && addresses.size >= maxAddresses)) {
      res.set("Retry-After", String(Math.ceil(windowMs / 1000)));
      return res.status(429).send("Too many authentication attempts. Please try again later.");
    }
    if (!entry) {
      entry = { start: time, count: 0 };
      addresses.set(address, entry);
    }
    entry.count++;
    globalWindow.count++;
    active++;
    let released = false;
    const release = () => { if (!released) { released = true; active--; } };
    res.once("finish", release);
    res.once("close", release);
    next();
  };
}
