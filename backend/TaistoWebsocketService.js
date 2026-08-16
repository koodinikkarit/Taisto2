
import {
	NEW_KWM_CONNECTION,
	NEW_VIDEO_CONNECTION,
	NEW_VIDEO_CONNECTIONS,
	NEW_KWM_CONNECTIONS,
	SET_VIDEO_CONNECTION,
	SET_KWM_CONNECTION,
	VIDEO_CONNECTION_TURN_OFF,
	KWM_CONNECTION_TURN_OFF,
	TURN_OFF_VIDEO_CONNECTION,
	TURN_OFF_KWM_CONNECTION
} from "../js/constants/actionconstants";

import {
	db,
	on
} from "./TaistoService";

import { Server as SocketIOServer } from "socket.io";
import { appendAuditLog } from "./storage/SqliteStorage";
import { getSessionIdentity } from "./auth";

const auditSocketMutation = (socket, action, target, details, success) => {
	try {
		const identity = getSessionIdentity(socket.request);
		appendAuditLog({
			actorType: identity ? "user" : "websocket",
			actorId: identity ? String(identity.id || "") : "",
			actorName: identity ? identity.username : "Taisto WebSocket client",
			action,
			target,
			method: "WEBSOCKET",
			path: socket.handshake && socket.handshake.url ? socket.handshake.url : "/socket.io",
			statusCode: success ? 200 : 400,
			success,
			ipAddress: socket.handshake && socket.handshake.address ? socket.handshake.address : "",
			details
		});
	} catch (error) {
		console.error("WebSocket audit log write failed", error);
	}
};

export const createService = (server) => {
	const io = new SocketIOServer(server);
	on(NEW_VIDEO_CONNECTIONS, videoConnections => io.emit(NEW_VIDEO_CONNECTIONS, videoConnections));
	on(NEW_KWM_CONNECTIONS, kwmConnections => io.emit(NEW_KWM_CONNECTIONS, kwmConnections));
	on(NEW_VIDEO_CONNECTION, (con, cpu) => io.emit(NEW_VIDEO_CONNECTION, {
		con,
		cpu
	}));
	on(NEW_KWM_CONNECTION, (cpu, con) => io.emit(NEW_KWM_CONNECTION, {
		cpu,
		con
	}));
	on("TURN_OFF_CON_PORT", con => io.emit("CON_PORT_TURN_OFF", con));
	on("TURN_OFF_CPU_PORT", cpu => io.emit("CPU_PORT_TURN_OFF", cpu));
	on("MATRIX_CONNECTION_STATE_CHANGED", (reason, id, ip, port) => io.emit("MATRIX_CONNECTION_STATE_CHANGED", reason, id, ip, port));
	io.on("connection", function (socket) {
		db.matrixs.forEach(matrix => {
			matrix.requestAllStates();
		});
		socket.on(SET_VIDEO_CONNECTION, (connection) => {
			var conPort = db.conPorts.get(parseInt(connection.con));
			if (conPort) {
				conPort.setValue(parseInt(connection.cpu));
			}
			auditSocketMutation(socket, "matrix.video.set", `con-port/${connection.con}`, { cpuPortId: connection.cpu }, Boolean(conPort));
		});
		socket.on(SET_KWM_CONNECTION, connection => {
			var cpuPort = db.cpuPorts.get(parseInt(connection.cpu));
			if (cpuPort) {
				cpuPort.setValue(parseInt(connection.con));
			}
			auditSocketMutation(socket, "matrix.kvm.set", `cpu-port/${connection.cpu}`, { conPortId: connection.con }, Boolean(cpuPort));
		});
		socket.on(TURN_OFF_VIDEO_CONNECTION, con => {
			var conPort = db.conPorts.get(parseInt(con));
			if (conPort) {
				conPort.turnOffPort();
			}
			auditSocketMutation(socket, "matrix.video.turn_off", `con-port/${con}`, {}, Boolean(conPort));

		});
		socket.on(TURN_OFF_KWM_CONNECTION, cpu => {
			var cpuPort = db.cpuPorts.get(parseInt(cpu));
			if (cpuPort) {
				cpuPort.turnOffPort();
			}
			auditSocketMutation(socket, "matrix.kvm.turn_off", `cpu-port/${cpu}`, {}, Boolean(cpuPort));
		});
		socket.on("REQUEST_ALL_STATES", matrixId => {
			var matrix = db.matrixs.get(parseInt(matrixId));
			if (matrix) {
				matrix.requestAllStates();
			}
		});
	});
}
