import path from "path";
import crypto from "crypto";
import express from "express";
import webpack from "webpack";
import WebpackMiddleware from "webpack-dev-middleware";
import { createHandler } from "graphql-http/lib/use/express";
import React from "react";
import ReactDOMServer from "react-dom/server";

import schema from "./backend/graphql/RootTypes";
import PageFrame from "./js/components/PageFrame";

import { listen, connectMarix } from "./backend/TaistoService";

import { createService } from "./backend/TaistoWebsocketService";
import restRouter from "./backend/rest/router";

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
const protectedPassword = process.env.TAISTO_PASSWORD;
const protectedUser = process.env.TAISTO_USER || "taisto";
const sessionCookieName = "taisto_session";

function credentialsMatch(value, expected) {
	const valueBuffer = Buffer.from(value || "");
	const expectedBuffer = Buffer.from(expected);
	return valueBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

function signSession(expiresAt) {
	const payload = `${protectedUser}.${expiresAt}`;
	const signature = crypto.createHmac("sha256", protectedPassword).update(payload).digest("base64url");
	return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

function hasValidSession(req) {
	const cookie = (req.get("cookie") || "").split(";").map(value => value.trim()).find(value => value.startsWith(`${sessionCookieName}=`));
	if (!cookie || !protectedPassword) return false;
	const [user, expiresAt, signature] = Buffer.from(cookie.slice(sessionCookieName.length + 1), "base64url").toString("utf8").split(".");
	if (!user || !expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
	return credentialsMatch(user, protectedUser) && credentialsMatch(signature, crypto.createHmac("sha256", protectedPassword).update(`${user}.${expiresAt}`).digest("base64url"));
}

function safeNext(value) {
	return value && (value.startsWith("/promode") || value.startsWith("/settings")) ? value : "/";
}

function loginPage(next, error = false) {
	return `<!doctype html><html lang="fi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Taisto – Kirjaudu</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f2f4f6;font:16px system-ui,sans-serif;color:#243447}.card{width:min(360px,calc(100% - 48px));padding:32px;border-radius:12px;background:white;box-shadow:0 12px 35px #0002}h1{margin:0 0 8px}p{color:#5f6b76}label,input,button{display:block;width:100%;box-sizing:border-box}input{margin:8px 0 20px;padding:12px;border:1px solid #c8d0d8;border-radius:6px;font:inherit}button{padding:12px;border:0;border-radius:6px;background:#1677c8;color:white;font-weight:600;cursor:pointer}.error{color:#b42318;background:#fef3f2;padding:10px;border-radius:6px}</style></head><body><main class="card"><h1>Taisto</h1><p>Kirjaudu suojatulle alueelle.</p>${error ? '<p class="error">Virheellinen salasana.</p>' : ''}<form method="post" action="/login"><input type="hidden" name="next" value="${next}"><label for="password">Salasana</label><input id="password" name="password" type="password" required autofocus><button type="submit">Kirjaudu</button></form></main></body></html>`;
}

function requireProtectedAreaPassword(req, res, next) {
	if (!protectedPassword) return next();
	if (hasValidSession(req)) return next();
	const header = req.get("authorization") || "";
	const encodedCredentials = header.startsWith("Basic ") ? header.slice(6) : "";
	const credentials = Buffer.from(encodedCredentials, "base64").toString("utf8");
	const separator = credentials.indexOf(":");
	const user = separator === -1 ? "" : credentials.slice(0, separator);
	const password = separator === -1 ? "" : credentials.slice(separator + 1);

	if (credentialsMatch(user, protectedUser) && credentialsMatch(password, protectedPassword)) return next();

	return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
}

app.use("/static", express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use("/api", express.json());

app.get("/openapi.yaml", (req, res) => res.sendFile(path.resolve(__dirname, "openapi.yaml")));
app.get("/api-docs", (req, res) => res.sendFile(path.resolve(__dirname, "public", "api-docs.html")));

app.get("/login", (req, res) => res.send(loginPage(safeNext(req.query.next))));
app.post("/login", (req, res) => {
	const next = safeNext(req.body.next);
	if (!protectedPassword) return res.redirect(next);
	if (credentialsMatch(req.body.password, protectedPassword)) {
		const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
		const secure = req.secure ? "; Secure" : "";
		res.set("Set-Cookie", `${sessionCookieName}=${signSession(expiresAt)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`);
		return res.redirect(next);
	}
	return res.status(401).send(loginPage(next, true));
});

app.use(["/promode", "/settings"], requireProtectedAreaPassword);

app.use("/rest", restRouter);

const webpackEntry = {
	app: path.resolve(__dirname, "js", "app.js")
};

const webpackModule = {
	rules: [
		{
			test: /\.js$/,
			exclude: /node_modules/,
			use: {
				loader: "babel-loader"
			}
		}
	]
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
