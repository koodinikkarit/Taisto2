var net = require('net');
var events = require('events');

import fs from "fs";

import TaistoDb from "./records/TaistoDb";
import Matrix from "./records/Matrix";
import ConPort from "./records/ConPort";
import CpuPort from "./records/CpuPort";
import Diagram from "./records/Diagram";
import DiagramScreen from "./records/DiagramScreen";
import DiagramScreenCpuPort from "./records/DiagramScreenCpuPort";


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
					var newMatrix = new Matrix(loadedDatabase.matrixs[id]);
					matrixs.set(parseInt(id), newMatrix);
				});
			});
			db.conPorts = db.conPorts.withMutations(conPorts => {
				Object.keys(loadedDatabase.conPorts).forEach(id => {
					conPorts.set(parseInt(id), new ConPort(loadedDatabase.conPorts[id]));
				});
			});
			db.cpuPorts = db.cpuPorts.withMutations(cpuPorts => {
				Object.keys(loadedDatabase.cpuPorts).forEach(id => {
					cpuPorts.set(parseInt(id), new CpuPort(loadedDatabase.cpuPorts[id]));
				});
			});
		});
		db.matrixs.forEach(matrix => {
			registerMatrixEvents(matrix);
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
	var matrix;
	setDb(db.withMutations(db => {
		var id = db.nextMatrixId++;
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
				var conId = db.nextConPortId++;
				conPorts.set(conId, new ConPort({
					id: conId,
					portNum: i + 1,
					matrixId: id
				}));
			}
		});
		db.cpuPorts = db.cpuPorts.withMutations(cpuPorts => {
			for (var i = 0; i < numberOfCpuPorts; i++) {
				var cpuId = db.nextCpuPortId++;
				cpuPorts.set(cpuId, new CpuPort({
					id: cpuId,
					portNum: i + 1,
					matrixId: id
				}));
			}
		});
		registerMatrixEvents(matrix);
	}));
	return matrix;
}

export const createDiagram = (slug) => {
	var diagram;
	setDb(db.withMutations(db => {
		var id = db.nextDiagramId;
		diagram = new Diagram({
			id,
			slug
		});
		db.diagrams = db.diagrams.withMutations(diagrams => {
			diagrams.set(id, diagram);
		});
	}));
	return diagram;
}

export const createDiagramScreen = (diagramId, slug, matrixId, conPortId) => {
	var diagramScreen;
	setDb(db.withMutations(db => {
		var id = db.nextDiagramScreenId++;
		diagramScreen = new DiagramScreen({
			id,
			diagramId,
			slug,
			conPortId
		});
		db.diagramScreens = db.diagramScreens.set(id, diagramScreen);
	}));
	return diagramScreen;
}

export const addCpuToDiagramScreen = (diagramScreenId, cpuPortId) => {
	var diagramScreen = db.diagramScreens.get(diagramScreenId);
	var diagramScreenCpu;
	if (diagramScreen) {
		setDb(db.withMutations(db => {
			var id = db.nextDiagramScreenCpuPortId++;
			diagramScreenCpu = new DiagramScreenCpuPort({
				id,
				diagramScreenId,
				cpuPortId
			});
			db.diagramScreenCpuPorts = db.diagramScreenCpuPorts.set(id, diagramScreenCpu);
		}));
	}
	return diagramScreenCpu;
}

function registerMatrixEvents(matrix) {
	var id = matrix.id;
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
	matrix.on("MATRIX_CONNECTION_STATE_CHANGED", (reason, id, ip, port) => {
		emitter.emit("MATRIX_CONNECTION_STATE_CHANGED", reason, String(id), ip, port);
	});

	matrix.requestAllStates();
}

export const removeMatrix = (id) => {
	setDb(db.withMutations(db => {
		db.matrixs = db.matrixs.delete(id);
		db.conPorts = db.conPorts.withMutations(conPorts => {
			conPorts.forEach(conPort => {
				if (conPort.matrixId === id)
				conPorts.delete(conPort.id);
			});
		});
		db.cpuPorts = db.cpuPorts.withMutations(cpuPorts => {
			cpuPorts.forEach(cpuPort => {
				if (cpuPort.matrixId === id)
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