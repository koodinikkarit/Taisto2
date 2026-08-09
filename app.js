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

function credentialsMatch(value, expected) {
	const valueBuffer = Buffer.from(value || "");
	const expectedBuffer = Buffer.from(expected);
	return valueBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

function requireProtectedAreaPassword(req, res, next) {
	if (!protectedPassword) return next();
	const header = req.get("authorization") || "";
	const encodedCredentials = header.startsWith("Basic ") ? header.slice(6) : "";
	const credentials = Buffer.from(encodedCredentials, "base64").toString("utf8");
	const separator = credentials.indexOf(":");
	const user = separator === -1 ? "" : credentials.slice(0, separator);
	const password = separator === -1 ? "" : credentials.slice(separator + 1);

	if (credentialsMatch(user, protectedUser) && credentialsMatch(password, protectedPassword)) return next();

	res.set("WWW-Authenticate", 'Basic realm="Taisto protected area", charset="UTF-8"');
	return res.status(401).send("Authentication required");
}

app.use("/static", express.static("public"));

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
