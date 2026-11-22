import express from "express";

// Mount only after the settings/admin and projector/operator access checks.
export function registerProjectorEndpoints(app, projector) {
	const command = "/projector/command";
	const config = "/settings/projector/config";
	const status = "/projector/status";
	const parse = express.json({ limit: "4kb" });
	function json(req, res, next) {
		if (!req.is("application/json")) return res.status(415).json({ error: { message: "Expected application/json" } });
		return parse(req, res, err => err
			? res.status(err.status === 413 ? 413 : 400).json({ error: { message: "Invalid JSON request" } }) : next());
	}
	const reply = action => async (req, res) => {
		try {
			res.json(await action(req));
		} catch (err) {
			const known = [400, 409, 429, 502, 504].includes(err.status);
			res.status(known ? err.status : 500).json({ error: { message: known ? err.message : "Projector service unavailable" } });
		}
	};
	app.all([config, status, command], (req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
	app.get(config, reply(() => projector.getSettings()));
	app.put(config, json, reply(req => projector.configure(req.body)));
	app.get(status, reply(() => projector.status()));
	app.post(command, json, reply(req => {
		if (typeof req.body?.command !== "string" || Object.keys(req.body).length !== 1) {
			throw Object.assign(new Error("Expected a command name only"), { status: 400 });
		}
		return projector.command(req.body.command);
	}));
	app.all([config, status, command], (req, res) => res.status(405).json({ error: { message: "Method not allowed" } }));
}
