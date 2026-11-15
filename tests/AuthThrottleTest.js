import assert from "assert";
import { EventEmitter } from "events";
import { createAuthThrottle } from "../backend/authThrottle";

let time = 0;
const throttle = createAuthThrottle({ windowMs: 1000, perAddress: 2, globalLimit: 4, maxConcurrent: 2, now: () => time });
function attempt(ip, authorization = "", path = "/login", finish = true) {
  const req = { method: "POST", path, ip, get: () => authorization };
  const res = new EventEmitter();
  res.set = () => res;
  res.status = code => { res.code = code; return res; };
  res.send = () => res;
  let accepted = false;
  throttle(req, res, () => { accepted = true; });
  if (finish && accepted) res.emit("finish");
  return { accepted, res };
}
assert.strictEqual(attempt("one").accepted, true);
assert.strictEqual(attempt("one").accepted, true);
assert.strictEqual(attempt("one").res.code, 429);
assert.strictEqual(attempt("two", "Basic abc", "/settings").accepted, true);
assert.strictEqual(attempt("two").accepted, true);
assert.strictEqual(attempt("three").res.code, 429, "global limit caps distributed requests");
time += 1000;
const first = attempt("one", "", "/login", false);
const second = attempt("two", "", "/login", false);
assert.strictEqual(attempt("three").res.code, 429, "concurrent work is bounded");
first.res.emit("close");
assert.strictEqual(attempt("three").accepted, true);
second.res.emit("finish");
assert.strictEqual(attempt("one", "", "/rest").accepted, true, "ordinary requests bypass the authentication throttle");
time += 1000;
assert.strictEqual(attempt("four", "", "/LOGIN/").accepted, true);
assert.strictEqual(attempt("four", "", "/login/").accepted, true);
assert.strictEqual(attempt("four", "", "/login").res.code, 429, "login path variants share the same limit");
console.log("Authentication throttle tests passed");
