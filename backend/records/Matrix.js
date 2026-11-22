import Immutable from "immutable";
import { EventEmitter } from "events";
import MatrixConnection from "./MatrixConnection";
import {
	SET_KWM_CONNECTION, SET_VIDEO_CONNECTION, REQUEST_ALL_STATES,
	TURN_OFF_CON_PORT, TURN_OFF_CPU_PORT
} from "./MatrixCommands";

// Immutable records can be replaced by edits; sockets and subscribers belong
// to the logical matrix, not to one particular copy of its record.
const connections = new Map();
const retired = new WeakSet();

function matches(connection, matrix) {
	const previous = connection.matrix;
	return previous.ip === matrix.ip && Number(previous.port) === Number(matrix.port) && previous.mock === matrix.mock;
}

function connectionFor(matrix) {
	if (retired.has(matrix)) return null;
	let connection = connections.get(matrix.id);
	if (!connection) {
		connection = new MatrixConnection(matrix, new EventEmitter(), handleData);
		connections.set(matrix.id, connection);
	}
	// Only an explicit settings change can switch the active endpoint.
	return matches(connection, matrix) ? connection : null;
}

function command(matrix, event, code, ...ports) {
	const connection = connectionFor(matrix);
	if (!connection) return;
	if (matrix.mock) connection.emitter.emit(event, ...ports);
	else connection.command(Buffer.from([2, code, ...ports.map(n => 128 + n), 3]));
}

export default class extends Immutable.Record({
	id: null,
	ip: "",
	port: "",
	slug: "",
	numberOfConPorts: 0,
	numberOfCpuPorts: 0,
	mock: false
}) {
	setVideoConnection(con, cpu) {
		command(this, "SET_VIDEO_CONNECTION", SET_VIDEO_CONNECTION, con, cpu);
	}

	turnOffVideoConnection(con) {
		command(this, "TURN_OFF_CON_PORT", TURN_OFF_CON_PORT, con);
	}

	setFullVideoConnections() {}
	turnOffAllVideoConnections() {}

	setKwmConnection(cpu, con) {
		command(this, "SET_KWM_CONNECTION", SET_KWM_CONNECTION, cpu, con);
	}

	turnOffKwmConnection(cpu) {
		command(this, "TURN_OFF_CPU_PORT", TURN_OFF_CPU_PORT, cpu);
	}

	setFullKwmConnections() {}
	turnOffAllKwmConnections() {}

	requestAllStates() {
		const connection = connectionFor(this);
		if (connection) connection.requestAllStates();
	}

	reconnect() {
		if (retired.has(this)) return;
		const previous = connections.get(this.id);
		if (previous && !matches(previous, this)) {
			previous.dispose();
			retired.add(previous.matrix);
			connections.set(this.id, new MatrixConnection(this, previous.emitter, handleData));
		}
		this.requestAllStates();
	}

	get connectionState() {
		if (retired.has(this)) return "UNKNOWN";
		const connection = connections.get(this.id);
		if (connection && matches(connection, this)) return connection.state;
		return this.mock ? "CONNECTED" : "UNKNOWN";
	}

	destroy() {
		const connection = connections.get(this.id);
		if (!retired.has(this) && connection && matches(connection, this)) {
			connections.delete(this.id);
			retired.add(connection.matrix);
			connection.dispose();
			connection.emitter.removeAllListeners();
		}
		retired.add(this);
	}

	on(type, callback) {
		const connection = connectionFor(this);
		if (connection) connection.emitter.on(type, callback);
	}

	get conPorts() {
		return getDatabase().conPorts.filter(p => p.matrixId === this.id).sort((a, b) => a.portNum - b.portNum);
	}

	get cpuPorts() {
		return getDatabase().cpuPorts.filter(p => p.matrixId === this.id).sort((a, b) => a.portNum - b.portNum);
	}
}

// Resolve the service lazily so Matrix can also be imported independently in tests.
function getDatabase() {
	return require("../TaistoService").db;
}

function handleData(matrix, emitter, data) {
	if (data[0] !== 2) return;
	switch (data[1]) {
	case SET_KWM_CONNECTION:
		emitter.emit("SET_KWM_CONNECTION", data[3] - 128, data[2] - 128);
		break;
	case SET_VIDEO_CONNECTION:
		emitter.emit("SET_VIDEO_CONNECTION", data[2] - 128, data[3] - 128);
		break;
	case TURN_OFF_CON_PORT:
		emitter.emit("TURN_OFF_CON_PORT", data[2] - 128);
		break;
	case TURN_OFF_CPU_PORT:
		emitter.emit("TURN_OFF_CPU_PORT", data[2] - 128);
		break;
	case REQUEST_ALL_STATES: {
		const { id, numberOfConPorts, numberOfCpuPorts } = matrix;
		const db = getDatabase();
		const conConnections = {};
		const cpuConnections = {};
		for (let n = 1; n <= numberOfConPorts; n++) {
			const con = db.conPorts.find(p => p.matrixId === id && p.portNum === n);
			const cpu = db.cpuPorts.find(p => p.matrixId === id && p.portNum === data[1 + n] - 128);
			if (con) conConnections[String(con.id)] = cpu ? String(cpu.id) : 0;
		}
		for (let n = 1; n <= numberOfCpuPorts; n++) {
			const cpu = db.cpuPorts.find(p => p.matrixId === id && p.portNum === n);
			const con = db.conPorts.find(p => p.matrixId === id && p.portNum === data[1 + numberOfConPorts + n] - 128);
			if (cpu) cpuConnections[String(cpu.id)] = con ? String(con.id) : 0;
		}
		emitter.emit("REQUEST_ALL_STATES", conConnections, cpuConnections);
		break;
	}
	}
}
