const net = require("net");
import { REQUEST_ALL_STATES } from "./MatrixCommands";

const stateRequest = Buffer.from([2, REQUEST_ALL_STATES, 3]);
const initialRetryMs = 1000;

function after(ms, callback) {
	const timer = setTimeout(callback, ms);
	timer.unref();
	return timer;
}

// An instance owns exactly one TCP attempt or one scheduled retry. Only the
// current socket may deliver data or change the reported connection state.
export default class MatrixConnection {
	constructor(matrix, emitter, handleData) {
		this.matrix = matrix;
		this.emitter = emitter;
		this.handleData = handleData;
		this.state = matrix.mock ? "CONNECTED" : "UNKNOWN";
		this.socket = null;
		this.retry = null;
		this.deadline = null;
		this.retryMs = initialRetryMs;
		this.pending = [];
		this.disposed = false;
	}

	setState(state) {
		if (state === this.state) return;
		this.state = state;
		const { id, ip, port } = this.matrix;
		this.emitter.emit("MATRIX_CONNECTION_STATE_CHANGED", state, id, ip, port);
	}

	requestAllStates() {
		if (this.disposed || this.retry) return;
		if (this.matrix.mock) this.emitter.emit("REQUEST_ALL_STATES", {}, {});
		else if (this.socket && this.state === "CONNECTED") this.write(this.socket, stateRequest);
		else this.connect(); // Every successful connection requests a fresh snapshot.
	}

	command(data) {
		if (this.disposed || this.retry) return;
		if (this.socket && this.state === "CONNECTED") {
			this.write(this.socket, data);
		} else {
			// Pending writes belong only to this attempt, never to a retry.
			this.pending.push(data);
			this.connect();
		}
	}

	connect() {
		if (this.disposed || this.socket || this.retry) return;
		const { ip, port } = this.matrix;
		if (!ip || !Number.isInteger(Number(port)) || Number(port) < 1 || Number(port) > 65535) {
			this.pending = [];
			this.setState("DISCONNECTED");
			return;
		}
		const socket = new net.Socket();
		this.socket = socket;
		socket.on("error", err => this.fail(socket, err));
		socket.on("close", () => this.fail(socket));
		socket.on("data", data => {
			if (this.socket === socket) this.handleData(this.matrix, this.emitter, data);
		});
		this.deadline = after(10000, () => this.fail(socket));
		if (this.state === "UNKNOWN") this.setState("CONNECTING");
		try {
			socket.setKeepAlive(true, 30000);
			socket.connect(Number(port), ip, () => {
				if (this.socket !== socket) return;
				clearTimeout(this.deadline);
				this.deadline = null;
				this.retryMs = initialRetryMs;
				const pending = this.pending;
				this.pending = [];
				// Read the router on every new connection even with no browser open.
				this.write(socket, stateRequest);
				for (const data of pending) this.write(socket, data);
				if (this.socket === socket) this.setState("CONNECTED");
			});
		} catch (error) {
			this.fail(socket, error);
		}
	}

	write(socket, data) {
		if (this.socket !== socket) return;
		try {
			socket.write(data);
		} catch (error) {
			this.fail(socket, error);
		}
	}

	fail(socket, error) {
		if (this.socket !== socket) return;
		this.releaseSocket();
		this.retry = after(this.retryMs, () => {
			this.retry = null;
			this.connect();
		});
		this.retryMs = Math.min(30000, this.retryMs * 2);
		const dnsFailure = error && (error.code === "ENOTFOUND" || error.errno === "ENOTFOUND");
		this.setState(dnsFailure ? "ADDRESS_NOT_FOUND" : "DISCONNECTED");
	}

	releaseSocket() {
		const socket = this.socket;
		this.socket = null; // Late close, data and connect callbacks no longer own this session.
		this.pending = [];
		clearTimeout(this.deadline);
		this.deadline = null;
		if (socket) socket.destroy();
	}

	dispose() {
		this.disposed = true;
		clearTimeout(this.retry);
		this.retry = null;
		this.releaseSocket();
	}
}
