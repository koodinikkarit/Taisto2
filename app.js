import path from "path";
import express from "express";
import webpack from "webpack";
import WebpackMiddleware from "webpack-dev-middleware";
import { createHandler } from "graphql-http/lib/use/express";
import { getGraphqlOperation, requiresGraphqlAdmin } from "./backend/graphql/operation";
import React from "react";
import ReactDOMServer from "react-dom/server";

import schema from "./backend/graphql/RootTypes";
import PageFrame from "./js/components/PageFrame";

import {
	listen,
	connectMarix,
	getRestApiKeyStatus,
	createRestApiKey,
	revokeRestApiKey,
	setRestApiKeyEnabled,
	setRestApiKeyName,
	setRestApiKeyExpiration,
	allowAnonymousRestApi,
	disableAnonymousRestApi
} from "./backend/TaistoService";

import { createService } from "./backend/TaistoWebsocketService";
import restRouter from "./backend/rest/router";
import { auditHttpMutations } from "./backend/audit";
import {
	listAuditLogs,
	getAuditRetentionDays,
	listUsers,
	countAdminUsers,
	createUser,
	updateUser,
	deleteUser,
	recordUserLogin,
	getTelegramConfig,
	saveTelegramConfig,
	appendAuditLog,
	subscribeAuditLog
} from "./backend/storage/SqliteStorage";
import { createTelegramBot } from "./backend/telegram/bot";
import { createTelegramService } from "./backend/telegram/service";
import { createDriveBackupService, BackupRequestError } from "./backend/drive/service";
import {
	authenticateBasicHeaderAsync,
	authenticateCredentialsAsync,
	defaultLoginUsername,
	expiredSessionCookieHeader,
	getRequestAuthorization,
	getSessionIdentity,
	isAuthenticationRequired,
	sessionCookieHeader,
	revokeRequestSession,
	usesDatabaseUsers
} from "./backend/auth";
import { createAuthThrottle } from "./backend/authThrottle";

const app = express();

var port;
var development = false;

process.argv.forEach(function(arg, index) {
	if (arg === "-p") {
		port = process.argv[index + 1];
	}
	if (arg === "-d") {
		development = true;
	}
});

const APP_PORT = 80;

function safeNext(value) {
	return value && (value.startsWith("/promode") || value.startsWith("/settings")) ? value : "/";
}

function escapeHtml(value) {
	return String(value || "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function loginPage(next, error = false) {
	const username = escapeHtml(defaultLoginUsername());
	return `<!doctype html>
<html lang="fi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Kirjaudu sisään – Taisto</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; min-height: 100dvh; display: grid; place-items: center; padding: 32px 20px; background: #edf3f7; color: #142e42; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
    .shell { width: min(100%, 960px); display: grid; grid-template-columns: 0.95fr 1.05fr; overflow: hidden; background: #fff; border: 1px solid #d8e4eb; border-radius: 22px; box-shadow: 0 24px 70px rgba(23, 48, 66, .12), 0 4px 12px rgba(23, 48, 66, .04); }
    .intro { position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; min-height: 540px; padding: 42px; color: #fff; background: #132c3e; }
    .intro::after { content: ""; position: absolute; right: -90px; bottom: -150px; width: 350px; height: 350px; border: 1px solid rgba(87, 203, 190, .22); border-radius: 50%; box-shadow: 0 0 0 48px rgba(87, 203, 190, .035), 0 0 0 96px rgba(87, 203, 190, .025); pointer-events: none; }
    .intro-content, .intro-footer, .logo { position: relative; z-index: 1; }
    .logo { display: inline-flex; align-self: flex-start; padding: 7px 10px; background: #fff; border-radius: 9px; }
    .logo img { display: block; width: 148px; height: auto; }
    .eyebrow { display: inline-block; margin: 0 0 15px; color: #75d8ca; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    .intro-title { max-width: 290px; margin: 0 0 16px; font-size: clamp(30px, 4vw, 40px); line-height: 1.12; letter-spacing: -.035em; }
    .intro-copy { max-width: 310px; margin: 0; color: #c2d6e2; line-height: 1.65; }
    .intro-footer { margin: 0; color: #a5bfce; font-size: 13px; }
    .login { display: flex; flex-direction: column; justify-content: center; min-width: 0; padding: 48px clamp(28px, 6vw, 72px); }
    .login-content { width: 100%; max-width: 360px; margin: 0 auto; }
    .login-eyebrow { margin: 0 0 10px; color: #087e78; font-size: 12px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
    h1 { margin: 0 0 8px; color: #112d43; font-size: 30px; line-height: 1.2; letter-spacing: -.03em; }
    .description { margin: 0 0 28px; color: #617689; }
    label { display: block; margin: 18px 0 7px; color: #314d62; font-size: 14px; font-weight: 650; }
    input, button { display: block; width: 100%; font: inherit; }
    input:not([type="hidden"]) { height: 50px; padding: 11px 14px; color: #142e42; background: #fbfdfe; border: 1px solid #cbdbe5; border-radius: 9px; }
    input:focus-visible, button:focus-visible, a:focus-visible { outline: 3px solid #68b8e9; outline-offset: 2px; }
    input:focus-visible { border-color: #1983c0; }
    button { min-height: 50px; margin-top: 26px; padding: 12px 18px; border: 0; border-radius: 9px; color: #fff; background: #1267a8; font-weight: 700; cursor: pointer; }
    button:hover { background: #0c548c; }
    .error { margin: 0 0 18px; padding: 12px 14px; border: 1px solid #f2c3be; border-radius: 9px; color: #a72b22; background: #fff3f1; font-size: 14px; }
    .back { display: inline-block; margin-top: 24px; color: #416479; font-size: 14px; text-decoration: none; }
    .back:hover { color: #1267a8; text-decoration: underline; }
    @media (max-width: 700px) {
      body { display: block; padding: 18px 14px; }
      .shell { margin: 0 auto; grid-template-columns: 1fr; border-radius: 17px; }
      .intro { min-height: 0; padding: 24px; gap: 20px; }
      .intro::after, .intro-footer { display: none; }
      .logo img { width: 122px; }
      .eyebrow { margin-bottom: 7px; }
      .intro-title { margin-bottom: 7px; font-size: 26px; }
      .intro-copy { font-size: 14px; }
      .login { padding: 30px 24px 32px; }
      h1 { font-size: 26px; }
      .description { margin-bottom: 20px; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="intro" aria-label="Taisto">
      <div class="logo"><img src="/static/taisto-logo-naytto-kytkenta.png" alt="Taisto"></div>
      <div class="intro-content"><p class="eyebrow">Matriisinhallinta</p><h2 class="intro-title">Kaikki näytöt, yhdessä paikassa.</h2><p class="intro-copy">Hallitse näyttöjen lähteitä ja kytkentöjä selkeästi Taistossa.</p></div>
      <p class="intro-footer">Taisto · Matriisinhallinta</p>
    </section>
    <section class="login" aria-labelledby="login-title">
      <div class="login-content">
        <p class="login-eyebrow">Tervetuloa</p>
        <h1 id="login-title">Kirjaudu sisään</h1>
        <p class="description">Jatka kirjautumalla Taisto-tunnuksellasi.</p>
        ${error ? '<p class="error" role="alert">Virheellinen käyttäjätunnus tai salasana.</p>' : ''}
        <form method="post" action="/login">
          <input type="hidden" name="next" value="${escapeHtml(next)}">
          <label for="username">Käyttäjätunnus</label>
          <input id="username" name="username" autocomplete="username" value="${username}" required autofocus>
          <label for="password">Salasana</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required>
          <button type="submit">Kirjaudu sisään</button>
        </form>
        <a class="back" href="/">← Takaisin etusivulle</a>
      </div>
    </section>
  </main>
</body>
</html>`;
}

async function requestIdentity(req) {
	return getSessionIdentity(req) || await authenticateBasicHeaderAsync(req.get("authorization"));
}

function credentialError(error, res, next) {
	if (error.status === 429) return res.set("Retry-After", "60").status(429).send("Too many authentication attempts. Please try again later.");
	return next(error);
}

async function requireAuthenticated(req, res, next) {
	try {
	if (!isAuthenticationRequired()) return next();
	const identity = await requestIdentity(req);
	if (identity) {
		req.auditActor = { type: "user", id: String(identity.id || ""), name: identity.username };
		return next();
	}
	return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
	} catch (error) { return credentialError(error, res, next); }
}

async function requireAdmin(req, res, next) {
	try {
	const driveApi = /^\/drive-backup\/(config|run)\/?$/i.test(req.path);
	if (!isAuthenticationRequired()) {
		if (driveApi) return res.set("Cache-Control", "no-store").status(403).json({ error: { message: "Configure administrator authentication before using Drive backups" } });
		return next();
	}
	const identity = await requestIdentity(req);
	if (identity && identity.role === "admin") {
		req.auditActor = { type: "user", id: String(identity.id || ""), name: identity.username };
		return next();
	}
	// These endpoints are JSON-only, even when a browser sends Accept: */*.
	// An expired session must not look like a successful write in the audit log.
	if (driveApi || /^\/telegram\/(config|status)\/?$/i.test(req.path)) {
		req.auditActor = identity
			? { type: "user", id: String(identity.id || ""), name: identity.username }
			: { type: "unauthenticated", id: "", name: "" };
		return res.set("Cache-Control", "no-store").status(identity ? 403 : 401)
			.json({ error: { message: identity ? "Admin access is required" : "Authentication is required" } });
	}
	if (!identity) return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
	if (req.get("accept") && req.get("accept").includes("application/json")) return res.status(403).json({ error: { message: "Admin access is required" } });
	return res.status(403).send("<!doctype html><html lang=\"fi\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Ei käyttöoikeutta</title><body style=\"font:16px system-ui;padding:40px\"><h1>Ei käyttöoikeutta</h1><p>Asetusten hallinta vaatii admin-oikeuden.</p><a href=\"/\">Palaa etusivulle</a></body></html>");
	} catch (error) { return credentialError(error, res, next); }
}

app.use("/static", express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use("/api", express.json());
app.use(auditHttpMutations({ getSessionIdentity }));
app.use(createAuthThrottle());

app.get("/downloads/taisto-companion.zip", (req, res) => {
	res.download(
		path.resolve(__dirname, "public", "taisto-companion.zip"),
		"taisto-companion.zip"
	);
});

app.get("/openapi.yaml", (req, res) => res.sendFile(path.resolve(__dirname, "openapi.yaml")));
app.get("/api-docs", (req, res) => res.sendFile(path.resolve(__dirname, "public", "api-docs.html")));

app.get("/login", (req, res) => {
	if (!isAuthenticationRequired()) return res.redirect(safeNext(req.query.next));
	return res.send(loginPage(safeNext(req.query.next)));
});
app.get("/auth/status", (req, res) => {
	const authorization = getRequestAuthorization(req);
	res.set("Cache-Control", "no-store");
	res.json(authorization);
});
app.post("/login", async (req, res, nextError) => {
	try {
	const next = safeNext(req.body.next);
	if (!isAuthenticationRequired()) return res.redirect(next);
	const identity = await authenticateCredentialsAsync(req.body.username, req.body.password);
	if (identity) {
		if (identity.source === "database") recordUserLogin(identity.id, req.ip || (req.socket && req.socket.remoteAddress) || "");
		req.auditActor = { type: "user", id: String(identity.id || ""), name: identity.username };
		const cookie = sessionCookieHeader(identity, req.secure);
		res.set("Set-Cookie", cookie.value);
		return res.redirect(next);
	}
	return res.status(401).send(loginPage(next, true));
	} catch (error) {
		return credentialError(error, res, nextError);
	}
});
app.post("/logout", (req, res) => {
	revokeRequestSession(req);
	res.set("Set-Cookie", expiredSessionCookieHeader(req.secure));
	return res.redirect("/");
});

app.use("/promode", requireAuthenticated);
app.use("/settings", requireAdmin);

const driveBackups = createDriveBackupService();
app.use("/settings/drive-backup", (req, res, next) => {
	res.set("Cache-Control", "no-store");
	if (["PUT", "POST"].includes(req.method) && !req.is("application/json")) {
		return res.status(415).json({ error: { message: "Expected application/json" } });
	}
	return next();
});
function driveEndpoint(handler) {
	return (req, res) => {
		try { handler(req, res); }
		catch (err) {
			if (err instanceof BackupRequestError) return res.status(err.status).json({ error: { message: err.message } });
			return res.status(500).json({ error: { message: "Drive backup settings unavailable" } });
		}
	};
}
app.get("/settings/drive-backup/config", driveEndpoint((req, res) => res.json(driveBackups.status())));
app.put("/settings/drive-backup/config", express.json({ limit: "4kb" }), driveEndpoint((req, res) => res.json(driveBackups.configure(req.body))));
app.post("/settings/drive-backup/run", express.json({ limit: "1kb" }), driveEndpoint((req, res) => {
	driveBackups.run({ id: req.auditActor.id, name: req.auditActor.name, ip: req.ip });
	res.status(202).json({ accepted: true });
}));

function telegramPublicConfig(config) {
	return {
		enabled: config.enabled,
		tokenConfigured: Boolean(config.botToken),
		allowedUserIds: config.allowedUserIds.join(", "),
		allowedUserNames: config.allowedUserNames,
		auditEnabled: config.auditEnabled,
		auditChatId: config.auditChatId
	};
}

app.get("/settings/telegram/config", (req, res) => {
	res.set("Cache-Control", "no-store").json(telegramPublicConfig(getTelegramConfig()));
});
app.get("/settings/telegram/status", (req, res) => {
	res.set("Cache-Control", "no-store").json(telegramBot.getStatus());
});
// Allow an optional 80-character display name for each ID in the bounded allowlist.
app.put("/settings/telegram/config", express.json({ limit: "384kb" }), (req, res) => {
	try {
		const config = saveTelegramConfig(req.body);
		return res.set("Cache-Control", "no-store").json(telegramPublicConfig(config));
	} catch (error) {
		const safeErrors = new Set([
			"Invalid Telegram settings", "Telegram settings exceed the maximum length", "Invalid Telegram bot token",
			"Allowed Telegram user IDs must be positive numeric IDs", "Invalid Telegram user names", "Invalid Telegram audit chat ID",
			"Bot token is required", "Audit chat ID is required"
		]);
		if (safeErrors.has(error.message)) return res.status(400).json({ error: { message: error.message } });
		return res.status(500).json({ error: { message: "Could not save Telegram settings" } });
	}
});

app.get("/settings/users/data", (req, res) => res.json({
	users: listUsers(),
	environmentAdminConfigured: Boolean(process.env.TAISTO_PASSWORD),
	environmentFallbackActive: countAdminUsers() === 0 && Boolean(process.env.TAISTO_PASSWORD)
}));
app.post("/settings/users/data", express.json(), (req, res) => {
	try {
		const firstDatabaseUser = !usesDatabaseUsers();
		const user = createUser(req.body || {});
		if (firstDatabaseUser) {
			const identity = Object.assign({}, user, { source: "database" });
			recordUserLogin(user.id, req.ip || (req.socket && req.socket.remoteAddress) || "");
			const cookie = sessionCookieHeader(identity, req.secure);
			res.set("Set-Cookie", cookie.value);
			req.auditActor = { type: "user", id: String(user.id), name: user.username };
		}
		return res.status(201).json(user);
	} catch (error) {
		const duplicate = String(error.message || "").includes("UNIQUE constraint failed");
		return res.status(duplicate ? 409 : 400).json({ error: { message: duplicate ? "Username already exists" : error.message } });
	}
});
app.patch("/settings/users/data/:id", express.json(), (req, res) => {
	try {
		const user = updateUser(req.params.id, req.body || {}, { allowNoAdmin: Boolean(process.env.TAISTO_PASSWORD) });
		return user ? res.json(user) : res.status(404).json({ error: { message: "User not found" } });
	} catch (error) {
		const duplicate = String(error.message || "").includes("UNIQUE constraint failed");
		return res.status(duplicate ? 409 : 400).json({ error: { message: duplicate ? "Username already exists" : error.message } });
	}
});
app.delete("/settings/users/data/:id", (req, res) => {
	try {
		return deleteUser(req.params.id, { allowNoAdmin: Boolean(process.env.TAISTO_PASSWORD) }) ? res.status(204).end() : res.status(404).json({ error: { message: "User not found" } });
	} catch (error) {
		return res.status(400).json({ error: { message: error.message } });
	}
});

app.get("/settings/api-key/config", (req, res) => res.json(getRestApiKeyStatus()));
app.post("/settings/api-key/config", express.json(), (req, res) => {
	res.status(201).json(createRestApiKey(req.body.name, req.body.expiresInDays));
});
app.patch("/settings/api-key/config/:id", express.json(), (req, res) => {
	if (typeof req.body.enabled !== "boolean" && typeof req.body.name !== "string" && req.body.expiresAt === undefined) return res.status(400).json({ error: { message: "enabled, name or expiresAt is required" } });
	let key = typeof req.body.enabled === "boolean" ? setRestApiKeyEnabled(req.params.id, req.body.enabled) : null;
	if (typeof req.body.name === "string") key = setRestApiKeyName(req.params.id, req.body.name);
	if (req.body.expiresAt !== undefined) {
		key = setRestApiKeyExpiration(req.params.id, req.body.expiresAt);
		if (key === false) return res.status(400).json({ error: { message: "expiresAt must be an ISO date or empty" } });
	}
	if (!key) return res.status(404).json({ error: { message: "API key not found" } });
	return res.json(key);
});
app.delete("/settings/api-key/config/:id", (req, res) => {
	if (!revokeRestApiKey(req.params.id)) return res.status(404).json({ error: { message: "API key not found" } });
	return res.status(204).end();
});
app.post("/settings/api-key/anonymous", express.json(), (req, res) => {
	const anonymousUntil = allowAnonymousRestApi(req.body.durationMinutes);
	if (!anonymousUntil) return res.status(400).json({ error: { message: "durationMinutes must be between 1 and 43200" } });
	return res.json({ anonymousUntil, anonymousActive: true });
});
app.delete("/settings/api-key/anonymous", (req, res) => {
	disableAnonymousRestApi();
	return res.status(204).end();
});

app.get("/settings/audit-logs/data", (req, res) => {
	res.json(Object.assign(listAuditLogs({
		limit: req.query.limit,
		offset: req.query.offset,
		search: req.query.search,
		success: req.query.success,
		actorType: req.query.actorType,
		action: req.query.action,
		from: req.query.from,
		to: req.query.to
	}), {
		retentionDays: getAuditRetentionDays()
	}));
});

app.use("/rest", restRouter);

app.use("/api", async (req, res, next) => {
	try {
	if (!isAuthenticationRequired() || req.method === "GET" || !req.body || typeof req.body.query !== "string") return next();
	const operation = getGraphqlOperation(req.body.query, req.body.operationName);
	if (!requiresGraphqlAdmin(operation)) return next();
	const identity = await requestIdentity(req);
	if (!identity) return res.status(401).json({ errors: [{ message: "Authentication is required" }] });
	if (identity.role !== "admin") return res.status(403).json({ errors: [{ message: "Admin access is required" }] });
	req.auditActor = { type: "user", id: String(identity.id || ""), name: identity.username };
	return next();
	} catch (error) { return credentialError(error, res, next); }
});

const webpackEntry = {
	app: path.resolve(__dirname, "js", "app.js")
};

const webpackModule = {
	rules: [
		{
			test: /\.md$/,
			type: "asset/source"
		},
		{
			test: /\.js$/,
			exclude: /node_modules/,
			use: {
				loader: "babel-loader"
			}
		}
	]
};

const webpackResolve = {
	alias: {
		"@apollo/client/react/hoc": path.resolve(__dirname, "js", "apollo-hoc.js")
	}
};

const webpackOutput = {
	filename: "[name].js",
	path: path.resolve(__dirname, "public"),
	publicPath: "/js/"
};

if (development) {
	app.all("/api", createHandler({ schema, graphiql: true }));

	const compiler = webpack({
		mode: "development",
		devtool: "eval",
		entry: webpackEntry,
		resolve: webpackResolve,
		module: webpackModule,
		output: webpackOutput
	});
	app.use(
		WebpackMiddleware(compiler, {
			publicPath: webpackOutput.publicPath
		})
	);
	ssr();
} else {
	// const compiler = webpack({
	//     devtool: "cheap-module-source-map",
	//     entry: entry,
	//     module: module,
	//     plugins: [
	//         new webpack.DefinePlugin({
	//             'process.env': {
	//                 'NODE_ENV': JSON.stringify('production')
	//             }
	//         })
	//     ],
	//     output: output
	// });

	// compiler.run(function (err, stats) {

	// });

	app.all("/api", createHandler({ schema }));
	app.get("/js/app.js", function(req, res, next) {
		res.sendFile(__dirname + "/public/app.js");
	});
	ssr();
}

function ssr() {
	app.use((req, res) => {
		res.status(200).send(
			`<!doctype html>\n${ReactDOMServer.renderToString(
				<PageFrame content="" state={{}} />
			)}`
		);
	});
}

var server = app.listen(port || APP_PORT, () => {
	console.log("serveri on käynnissä");
});

createService(server);

// Telegram is opt-in and runs independently of the web server. Its allowlist
// and notification destination are checked against current settings at use.
const telegramBot = createTelegramBot({
	getConfig: getTelegramConfig,
	service: createTelegramService(),
	appendAuditLog
});
subscribeAuditLog(entry => telegramBot.sendAudit(entry));
telegramBot.start();
driveBackups.start();
server.on("close", () => { void driveBackups.stop(); });
server.on("close", () => { void telegramBot.stop(); });
