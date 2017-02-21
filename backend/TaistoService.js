var net = require('net');
var events = require('events');

import TaistoDb from "./records/TaistoDb";
import Matrix from "./records/Matrix";
import ConPort from "./records/ConPort";
import CpuPort from "./records/CpuPort";

import {
	Map
} from "immutable";

var matrixId = 1;
var conPortId = 1;
var cpuPortId = 1;

var db = new TaistoDb();

var emitter =  emitter = new events.EventEmitter();

export {
	db
};

var tcpServer = net.createServer(function (socket) {
	socket.write('Echo server\r\n');
	socket.pipe(socket);
	socket.on("data", function (data) {
		//server.destroy(); // kill client after server's response
	});
});

export const setDb = (d) => {
	if (d !== db) console.log("uuutta dataa");
	db = d;
}

export const connectMarix = (ip, port, slug, numberOfConPorts, numberOfCpuPorts) => {
	var id = matrixId++;
	var matrix;
	db = db.withMutations(db => {
		matrix = new Matrix({
			id,
			ip,
			port,
			slug,
			numberOfConPorts,
			numberOfCpuPorts
		});
		db.matrixs = db.matrixs.set(id, matrix);
		db.conPorts = db.conPorts.withMutations(conPorts => {
			for (var i = 0; i < numberOfConPorts; i++) {
				var conId = conPortId++;
				conPorts.set(conId, new ConPort({
					id: conId,
					portNum: i + 1,
					matrixId: id
				}));
			}
		});
		db.cpuPorts = db.cpuPorts.withMutations(cpuPorts => {
			for (var i = 0; i < numberOfCpuPorts; i++) {
				var cpuId = cpuPortId++;
				cpuPorts.set(cpuId, new CpuPort({
					id: cpuId,
					portNum: i + 1,
					matrixId: id
				}));
			}
		});

		matrix.on("REQUEST_ALL_STATES", (videoConnections, kwmConnections) => {
			emitter.emit("NEW_VIDEO_CONNECTIONS", videoConnections);
			emitter.emit("NEW_KWM_CONNECTIONS", kwmConnections);
		});
		matrix.on("SET_KWM_CONNECTION", (cpuPortNum, conPortNum) => {	
			var conPort = db.conPorts.find(p => p.matrixId === id && p.portNum === conPortNum);
			var cpuPort = db.cpuPorts.find(p => p.matrixId === id && p.portNum === cpuPortNum);
			emitter.emit("NEW_KWM_CONNECTION", String(cpuPort.id), String(conPort.id));
		});
		matrix.on("SET_VIDEO_CONNECTION", (conPortNum, cpuPortNum) => {	
			var conPort = db.conPorts.find(p => p.matrixId === id && p.portNum === conPortNum);
			var cpuPort = db.cpuPorts.find(p => p.matrixId === id && p.portNum === cpuPortNum);
			emitter.emit("NEW_VIDEO_CONNECTION", String(conPort.id), String(cpuPort.id));
		});
		matrix.on("TURN_OFF_CON_PORT", (conPortNum) => {
			var conPort = db.conPorts.find(p => p.matrixId === id && p.portNum === conPortNum);
			emitter.emit("TURN_OFF_CON_PORT", String(conPort.id))
		});
		matrix.on("TURN_OFF_CPU_PORT", (cpuPortNum) => {
			var cpuPort = db.cpuPorts.find(p => p.matrixId === id && p.portNum === cpuPortNum);
			emitter.emit("TURN_OFF_CPU_PORT", String(cpuPort.id));
		});

		matrix.requestAllStates();
	});
	return matrix;
} 

export const listen = (port) => {
	tcpServer.listen(port);
}

export const on = (eventType, callback) => {
	emitter.on(eventType, callback);
}