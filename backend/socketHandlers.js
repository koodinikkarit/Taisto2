import {
	SET_VIDEO_CONNECTION,
	SET_KWM_CONNECTION,
	TURN_OFF_VIDEO_CONNECTION,
	TURN_OFF_KWM_CONNECTION
} from "../js/constants/actionconstants";

// IDs originate from the database and may arrive as either numbers or strings.
const portId = value => {
	if (typeof value !== "number" && (typeof value !== "string" || !/^\d+$/.test(value))) return null;
	const id = Number(value);
	return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export function registerSocketHandlers(socket, getDatabase, audit) {
	socket.on(SET_VIDEO_CONNECTION, connection => {
		const con = connection && typeof connection === "object" && !Array.isArray(connection) ? portId(connection.con) : null;
		const cpu = connection && typeof connection === "object" && !Array.isArray(connection) ? portId(connection.cpu) : null;
		const conPort = con === null ? null : getDatabase().conPorts.get(con);
		if (conPort && cpu !== null) conPort.setValue(cpu);
		audit(socket, "matrix.video.set", `con-port/${con === null ? "invalid" : con}`, { cpuPortId: cpu }, Boolean(conPort && cpu !== null));
	});
	socket.on(SET_KWM_CONNECTION, connection => {
		const con = connection && typeof connection === "object" && !Array.isArray(connection) ? portId(connection.con) : null;
		const cpu = connection && typeof connection === "object" && !Array.isArray(connection) ? portId(connection.cpu) : null;
		const cpuPort = cpu === null ? null : getDatabase().cpuPorts.get(cpu);
		if (cpuPort && con !== null) cpuPort.setValue(con);
		audit(socket, "matrix.kvm.set", `cpu-port/${cpu === null ? "invalid" : cpu}`, { conPortId: con }, Boolean(cpuPort && con !== null));
	});
	socket.on(TURN_OFF_VIDEO_CONNECTION, value => {
		const con = portId(value);
		const conPort = con === null ? null : getDatabase().conPorts.get(con);
		if (conPort) conPort.turnOffPort();
		audit(socket, "matrix.video.turn_off", `con-port/${con === null ? "invalid" : con}`, {}, Boolean(conPort));
	});
	socket.on(TURN_OFF_KWM_CONNECTION, value => {
		const cpu = portId(value);
		const cpuPort = cpu === null ? null : getDatabase().cpuPorts.get(cpu);
		if (cpuPort) cpuPort.turnOffPort();
		audit(socket, "matrix.kvm.turn_off", `cpu-port/${cpu === null ? "invalid" : cpu}`, {}, Boolean(cpuPort));
	});
	socket.on("REQUEST_ALL_STATES", value => {
		const matrixId = portId(value);
		const matrix = matrixId === null ? null : getDatabase().matrixs.get(matrixId);
		if (matrix) matrix.requestAllStates();
	});
}
