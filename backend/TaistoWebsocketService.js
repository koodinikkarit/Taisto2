
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


export const createService = (server) => {
	var io = require('socket.io')(server);
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

	io.on("connection", function (socket) {
		db.matrixs.forEach(matrix => {
			matrix.requestAllStates();
		});
		socket.on(SET_VIDEO_CONNECTION, (connection) => {
			var conPort = db.conPorts.get(parseInt(connection.con));
			if (conPort) {
				conPort.setValue(parseInt(connection.cpu));
			}
		});
		socket.on(SET_KWM_CONNECTION, connection => {
			var cpuPort = db.cpuPorts.get(parseInt(connection.cpu));
			if (cpuPort) {
				cpuPort.setValue(parseInt(connection.con));
			}
		});
		socket.on(TURN_OFF_VIDEO_CONNECTION, con => {
			var conPort = db.conPorts.get(parseInt(con));
			if (conPort) {
				conPort.turnOffPort();
			}

		});
		socket.on(TURN_OFF_KWM_CONNECTION, cpu => {
			var cpuPort = db.cpuPorts.get(parseInt(cpu));
			if (cpuPort) {
				cpuPort.turnOffPort();
			}
		});
	});
}