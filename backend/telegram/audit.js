import { isIP } from "node:net";

// A name is a display label, never an authorization credential. Keep it on
// one line so a supplied name cannot add a second event to a Telegram batch.
const label = value => typeof value === "string" ? value
  .replace(/[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u2028-\u202e\u2066-\u2069]/g, " ")
  .trim().slice(0, 100) : "";

export function telegramAuditActor(sender, names = {}) {
  const actorId = String(sender.id);
  const alias = names && Object.hasOwn(names, actorId) ? label(names[actorId]) : "";
  const handle = typeof sender.username === "string" && /^[A-Za-z0-9_]{1,32}$/.test(sender.username) ? `@${sender.username}` : "";
  const fullName = label([label(sender.first_name), label(sender.last_name)].filter(Boolean).join(" "));
  return { actorType: "telegram", actorId, actorName: alias || handle || fullName || "Telegram-käyttäjä" };
}

function auditActorLabel(entry) {
  const name = label(entry.actorName);
  switch (entry.actorType) {
    case "telegram": {
      const id = String(entry.actorId || "");
      return (name || "Telegram-käyttäjä") + (/^[1-9]\d{0,19}$/.test(id) ? ` (Telegram ID: ${id})` : "");
    }
    case "user":
    case "session": return name || "Kirjautunut käyttäjä";
    case "api_key": return name ? `API-avain: ${name}` : "API-avain";
    case "invalid_api_key": return "Virheellinen tai puuttuva API-avain";
    case "scheduler": return "Taisto (ajastus)";
    case "unauthenticated": return "Tunnistamaton";
    case "anonymous":
    case "web":
    case "websocket": return "Anonyymi";
    default: return "Tuntematon";
  }
}

// Only forward these audit fields. In particular, bodies, credentials, URLs
// and arbitrary actor IDs do not belong in an external notification.
export function telegramAuditLine(entry = {}) {
  const action = typeof entry.action === "string" && /^[a-z0-9_.-]{1,80}$/i.test(entry.action) ? entry.action : "toiminto";
  const ip = typeof entry.ipAddress === "string" ? entry.ipAddress : "";
  const source = entry.actorType === "telegram" ? "ei saatavilla (Telegram)" :
    (isIP(ip) ? ip.split("%", 1)[0] : "ei saatavilla");
  return `${action} · ${entry.success ? "onnistui" : "epäonnistui"} · Käyttäjä: ${auditActorLabel(entry)} · IP: ${source}`;
}
