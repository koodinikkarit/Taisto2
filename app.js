import path from "path";
import express from "express";
import webpack from "webpack";
import WebpackMiddleware from "webpack-dev-middleware";
import { createHandler } from "graphql-http/lib/use/express";
import { parse } from "graphql";
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
	recordUserLogin
} from "./backend/storage/SqliteStorage";
import {
	authenticateBasicHeader,
	authenticateCredentials,
	defaultLoginUsername,
	expiredSessionCookieHeader,
	getRequestAuthorization,
	getSessionIdentity,
	isAuthenticationRequired,
	sessionCookieHeader,
	usesDatabaseUsers
} from "./backend/auth";

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
	return `<!doctype html><html lang="fi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Taisto – Kirjaudu</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f2f4f6;font:16px system-ui,sans-serif;color:#243447}.card{width:min(380px,calc(100% - 48px));padding:32px;border-radius:14px;background:white;box-shadow:0 12px 35px #0002}h1{margin:0 0 8px}p{color:#5f6b76}label,input,button{display:block;width:100%;box-sizing:border-box}label{font-weight:600;margin-top:16px}input{margin:7px 0 0;padding:12px;border:1px solid #c8d0d8;border-radius:7px;font:inherit}button{margin-top:24px;padding:12px;border:0;border-radius:7px;background:#1677c8;color:white;font-weight:700;cursor:pointer}.error{color:#b42318;background:#fef3f2;padding:10px;border-radius:6px}</style></head><body><main class="card"><h1>Taisto</h1><p>Kirjaudu suojatulle alueelle.</p>${error ? '<p class="error">Virheellinen käyttäjätunnus tai salasana.</p>' : ''}<form method="post" action="/login"><input type="hidden" name="next" value="${escapeHtml(next)}"><label for="username">Käyttäjätunnus</label><input id="username" name="username" autocomplete="username" value="${username}" required autofocus><label for="password">Salasana</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">Kirjaudu</button></form></main></body></html>`;
}

function requestIdentity(req) {
	return getSessionIdentity(req) || authenticateBasicHeader(req.get("authorization"));
}

function requireAuthenticated(req, res, next) {
	if (!isAuthenticationRequired()) return next();
	const identity = requestIdentity(req);
	if (identity) {
		req.auditActor = { type: "user", id: String(identity.id || ""), name: identity.username };
		return next();
	}
	return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
}

function requireAdmin(req, res, next) {
	if (!isAuthenticationRequired()) return next();
	const identity = requestIdentity(req);
	if (identity && identity.role === "admin") {
		req.auditActor = { type: "user", id: String(identity.id || ""), name: identity.username };
		return next();
	}
	if (!identity) return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
	if (req.get("accept") && req.get("accept").includes("application/json")) return res.status(403).json({ error: { message: "Admin access is required" } });
	return res.status(403).send("<!doctype html><html lang=\"fi\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Ei käyttöoikeutta</title><body style=\"font:16px system-ui;padding:40px\"><h1>Ei käyttöoikeutta</h1><p>Asetusten hallinta vaatii admin-oikeuden.</p><a href=\"/\">Palaa etusivulle</a></body></html>");
}

app.use("/static", express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use("/api", express.json());
app.use(auditHttpMutations({ getSessionIdentity }));

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
app.post("/login", (req, res) => {
	const next = safeNext(req.body.next);
	if (!isAuthenticationRequired()) return res.redirect(next);
	const identity = authenticateCredentials(req.body.username, req.body.password);
	if (identity) {
		if (identity.source === "database") recordUserLogin(identity.id, req.ip || (req.socket && req.socket.remoteAddress) || "");
		req.auditActor = { type: "user", id: String(identity.id || ""), name: identity.username };
		const cookie = sessionCookieHeader(identity, req.secure);
		res.set("Set-Cookie", cookie.value);
		return res.redirect(next);
	}
	return res.status(401).send(loginPage(next, true));
});
app.post("/logout", (req, res) => {
	res.set("Set-Cookie", expiredSessionCookieHeader(req.secure));
	return res.redirect("/");
});

app.use("/promode", requireAuthenticated);
app.use("/settings", requireAdmin);

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

const USER_GRAPHQL_MUTATIONS = new Set(["executeConGroup", "executeDefaultState"]);
app.use("/api", (req, res, next) => {
	if (!isAuthenticationRequired() || req.method === "GET" || !req.body || typeof req.body.query !== "string") return next();
	try {
		const document = parse(req.body.query);
		const operations = document.definitions.filter(definition => definition.kind === "OperationDefinition" && definition.operation === "mutation");
		if (!operations.length) return next();
		const fields = operations.reduce((result, operation) => result.concat(operation.selectionSet.selections.filter(selection => selection.kind === "Field").map(selection => selection.name.value)), []);
		if (fields.every(field => USER_GRAPHQL_MUTATIONS.has(field))) return next();
		const identity = requestIdentity(req);
		if (!identity) return res.status(401).json({ errors: [{ message: "Authentication is required" }] });
		if (identity.role !== "admin") return res.status(403).json({ errors: [{ message: "Admin access is required" }] });
		req.auditActor = { type: "user", id: String(identity.id || ""), name: identity.username };
		return next();
	} catch (error) {
		return next();
	}
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
