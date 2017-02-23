var net = require('net');
var events = require('events');

import fs from "fs";

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

var saveScheduled = false;


fs.readFile("./database.json", "utf8", (err, data) => {
	if (!err && data !== "undefined") {
		var loadedDatabase = JSON.parse(data);
		db = db.withMutations(db => {
			db.matrixs = db.matrixs.withMutations(matrixs => {
				Object.keys(loadedDatabase.matrixs).forEach(id => {
					matrixs.set(id, new Matrix(loadedDatabase.matrixs[id]));
				});
			});
			db.conPorts = db.conPorts.withMutations(conPorts => {
				Object.keys(loadedDatabase.conPorts).forEach(id => {
					conPorts.set(id, new ConPort(loadedDatabase.conPorts[id]));
				});
			});
			db.cpuPorts = db.cpuPorts.withMutations(cpuPorts => {
				Object.keys(loadedDatabase.cpuPorts).forEach(id => {
					cpuPorts.set(id, new CpuPort(loadedDatabase.cpuPorts[id]));
				});
			});
		});
	}
});

export const setDb = (newDatabase) => {
	if (newDatabase !== db) {
		db = newDatabase;
		if (!saveScheduled) {
			setTimeout(() => {
				fs.writeFile("./database.json", JSON.stringify(db), err => {
					if (!err) {
						saveScheduled = false;
						console.log("saved");
					} else {
						console.log("error while saving", err);
					}
				});
			}, 2000);
			saveScheduled = true;
		}
	}
}

export const connectMarix = (ip, port, slug, numberOfConPorts, numberOfCpuPorts) => {
	var id = matrixId++;
	var matrix;
	setDb(db.withMutations(db => {
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
	}));
	return matrix;
}

export const removeMatrix = (id) => {
	setDb(db.withMutations(db => {
		db.matrixs = db.matrixs.delete(id);
		db.conPorts = db.conPorts.withMutations(conPorts => {
			conPorts.forEach(conPort => {
				conPorts.delete(conPort.id);
			});
		});
		db.cpuPorts = db.cpuPorts.withMutations(cpuPorts => {
			cpuPorts.forEach(cpuPort => {
				cpuPorts.delete(cpuPort.id);
			});
		});
	}));
}

export const listen = (port) => {
	tcpServer.listen(port);
}

export const on = (eventType, callback) => {
	emitter.on(eventType, callback);
}