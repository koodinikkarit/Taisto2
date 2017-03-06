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
import DefaultState from "./records/DefaultState";
import DefaultStateVideoConnection from "./records/DefaultStateVideoConnection";
import DefaultStateKwmConnection from "./records/DefaultStateKwmConnection";
import WeeklyTimer from "./records/WeeklyTimer";
import WeeklyTimerVideConnection from "./records/WeeklyTimerVideoConnection";
import WeeklyTimerKwmConnection from "./records/WeeklyTimerKwmConnection";
import WeeklyTimerDefaultState from "./records/WeeklyTimerDefaultState";


import {
	Map
} from "immutable";

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
			db.nextMatrixId = loadedDatabase.nextMatrixId ? loadedDatabase.nextMatrixId : 1;
			db.nextConPortId = loadedDatabase.nextConPortId ? loadedDatabase.nextConPortId : 1;
			db.nextCpuPortId = loadedDatabase.nextCpuPortId ? loadedDatabase.nextCpuPortId : 1;
			db.nextDiagramId = loadedDatabase.nextDiagramId ? loadedDatabase.nextDiagramId : 1;
			db.nextDiagramScreenId = loadedDatabase.nextDiagramScreenId ? loadedDatabase.nextDiagramScreenId : 1;
			db.nextDiagramScreenCpuPortId = loadedDatabase.nextDiagramScreenCpuPortId ? loadedDatabase.nextDiagramScreenCpuPortId : 1;
			db.nextDefaultStateId = loadedDatabase.nextDefaultStateId ? loadedDatabase.nextDefaultStateId : 1;
			db.nextDefaultStateVideoConnectionId = loadedDatabase.nextDefaultStateVideoConnectionId ? loadedDatabase.nextDefaultStateVideoConnectionId : 1;
			db.nextDefaultStateKwmConnectionId = loadedDatabase.nextDefaultStateKwmConnectionId ? loadedDatabase.nextDefaultStateKwmConnectionId : 1;
			db.nextWeeklyTimerId = loadedDatabase.nextWeeklyTimerId ? loadedDatabase.nextWeeklyTimerId : 1;
			db.nextWeeklyTimerVideoConnectionsId = loadedDatabase.nextWeeklyTimerVideoConnectionsId ? loadedDatabase.nextWeeklyTimerVideoConnectionsId : 1;
			db.nextWeeklyTimerKwmConnectionId = loadedDatabase.nextWeeklyTimerKwmConnectionId ? loadedDatabase.nextWeeklyTimerKwmConnectionId : 1;
			db.nextWeeklyTimerDefaultStateId = loadedDatabase.nextWeeklyTimerDefaultStateId ? loadedDatabase.nextWeeklyTimerDefaultStateId : 1;
		
			if (loadedDatabase.matrixs) {
				db.matrixs = db.matrixs.withMutations(matrixs => {
					Object.keys(loadedDatabase.matrixs).forEach(id => {
						var newMatrix = new Matrix(loadedDatabase.matrixs[id]);
						matrixs.set(parseInt(id), newMatrix);
					});
				});
			}
			if (loadedDatabase.conPorts) {
				db.conPorts = db.conPorts.withMutations(conPorts => {
					Object.keys(loadedDatabase.conPorts).forEach(id => {
						conPorts.set(parseInt(id), new ConPort(loadedDatabase.conPorts[id]));
					});
				});
			}
			if (loadedDatabase.cpuPorts) {
				db.cpuPorts = db.cpuPorts.withMutations(cpuPorts => {
					Object.keys(loadedDatabase.cpuPorts).forEach(id => {
						cpuPorts.set(parseInt(id), new CpuPort(loadedDatabase.cpuPorts[id]));
					});
				});
			}
			if (loadedDatabase.diagrams) {
				db.diagrams = db.diagrams.withMutations(diagrams => {
					Object.keys(loadedDatabase.diagrams).forEach(id => {
						diagrams.set(parseInt(id), new Diagram(loadedDatabase.diagrams[id]));
					});
				});
			}
			if (loadedDatabase.diagramScreens) {
				db.diagramScreens = db.diagramScreens.withMutations(diagramScreens => {
					Object.keys(loadedDatabase.diagramScreens).forEach(id => {
						diagramScreens.set(parseInt(id), new DiagramScreen(loadedDatabase.diagramScreens[id]));
					});
				});
			}
			if (loadedDatabase.diagramScreenCpuPorts) {
				db.diagramScreenCpuPorts = db.diagramScreenCpuPorts.withMutations(diagramScreenCpuPorts => {
					Object.keys(loadedDatabase.diagramScreenCpuPorts).forEach(id => {
						diagramScreenCpuPorts.set(parseInt(id), new DiagramScreenCpuPort(loadedDatabase.diagramScreenCpuPorts[id]));
					});
				});
			}
			if (loadedDatabase.defaultStates) {
				db.defaultStates = db.defaultStates.withMutations(defaultStates => {
					Object.keys(loadedDatabase.defaultStates).forEach(id => {
						defaultStates.set(parseInt(id), new DefaultState(loadedDatabase.defaultStates[id]));
					});
				});
			}
			if (loadedDatabase.defaultStateVideoConnections) {
				db.defaultStateVideoConnections = db.defaultStateVideoConnections.withMutations(defaultStateVideoConnections => {
					Object.keys(loadedDatabase.defaultStateVideoConnections).forEach(id => {
						defaultStateVideoConnections.set(parseInt(id), new DefaultStateVideoConnection(loadedDatabase.defaultStateVideoConnections[id]));
					});
				});
			}
			if (loadedDatabase.defaultStateKwmConnections) {
				db.defaultStateKwmConnections = db.defaultStateKwmConnections.withMutations(defaultStateKwmConnections => {
					Object.keys(loadedDatabase.defaultStateKwmConnections).forEach(id => {
						defaultStateKwmConnections.set(parseInt(id), new DefaultStateKwmConnection(loadedDatabase.defaultStateKwmConnections[id]));
					});
				});
			}
			if (loadedDatabase.weeklyTimers) {
				db.weeklyTimers = db.weeklyTimers.withMutations(weeklyTimers => {
					Object.keys(loadedDatabase.weeklyTimers).forEach(id => {
						weeklyTimers.set(parseInt(id), new WeeklyTimer(loadedDatabase.weeklyTimers[id]));
					});
				});
			}
			if (loadedDatabase.weeklyTimerVideoConnections) {
				db.weeklyTimerVideoConnections = db.weeklyTimerVideoConnections.withMutations(weeklyTimerVideoConnections => {
					Object.keys(loadedDatabase.weeklyTimerVideoConnections).forEach(id => {
						weeklyTimerVideoConnections.set(parseInt(id), new WeeklyTimerVideConnection(loadedDatabase.weeklyTimerVideoConnections[id]));
					});
				});
			}
			if (loadedDatabase.weeklyTimerKwmConnections) {
				db.weeklyTimerKwmConnections = db.weeklyTimerKwmConnections.withMutations(weeklyTimerKwmConnections => {
					Object.keys(loadedDatabase.weeklyTimerKwmConnections).forEach(id => {
						weeklyTimerKwmConnections.set(parseInt(id), new WeeklyTimerKwmConnection(loadedDatabase.weeklyTimerKwmConnections[id]));
					});
				});
			}
			if (loadedDatabase.weeklyTimerDefaultStates) {
				db.weeklyTimerDefaultStates = db.weeklyTimerDefaultStates.withMutations(weeklyTimerDefaultStates => {
					Object.keys(loadedDatabase.weeklyTimerDefaultStates).forEach(id => {
						weeklyTimerDefaultStates.set(parseInt(id), new WeeklyTimerDefaultState(loadedDatabase.weeklyTimerDefaultStates[id]));
					});
				});
			}
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
		var id = db.nextDiagramId++;
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
			conPortId,
			matrixId
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

export const createDefaultState = (slug, matrixId) => {
	var defaultState;
	setDb(db.withMutations(db => {
		var id = db.nextDefaultStateId++;
		defaultState = new DefaultState({
			id,
			slug,
			matrixId
		});
		db.defaultStates = db.defaultStates.set(id, defaultState);
	}));
	return defaultState;
}

export const insertVideoConnectionToDefaultState = (defaultStateId, conPortId, cpuPortId) => {
	var defaultState = db.defaultStates.get(defaultStateId);
	var defaultStateVideoConnection;
	if (defaultState) {
		defaultStateVideoConnection = db.defaultStateVideoConnections.find(p => p.defaultStateId === defaultStateId && p.conPortId === conPortId);
		setDb(db.withMutations(db => {
			var id;
			if (defaultStateVideoConnection) {
				id = defaultStateVideoConnection.id;
				defaultStateVideoConnection = defaultStateVideoConnection.set("cpuPortId", cpuPortId);
 			} else {
				id = db.nextDefaultStateVideoConnectionId++;
				defaultStateVideoConnection = new DefaultStateVideoConnection({
					id,
					defaultStateId,
					conPortId,
					cpuPortId
				});
			}
			db.defaultStateVideoConnections = db.defaultStateVideoConnections.set(id, defaultStateVideoConnection);
		}));
	}
	return defaultStateVideoConnection;
}

export const insertKwmConnectionToDefaultState = (defaultStateId, conPortId, cpuPortId) => {
	var defaultState = db.defaultStates.get(defaultStateId);
	var defaultStateKwmConnection;
	if (defaultState) {
		defaultStateKwmConnection = db.defaultStateKwmConnections.find(p => p.defaultStateId === defaultStateId && p.cpuPortId === cpuPortId);
		setDb(db.withMutations(db => {
			var id;
			if (defaultStateKwmConnection) {
				id = defaultStateKwmConnection.id;
				defaultStateKwmConnection = defaultStateKwmConnection.set("conPortId", conPortId);
			} else {	
				id = db.nextDefaultStateKwmConnectionId++;
				defaultStateKwmConnection = new DefaultStateKwmConnection({
					id,
					defaultStateId,
					conPortId,
					cpuPortId
				});
			}
			db.defaultStateKwmConnections = db.defaultStateKwmConnections.set(id, defaultStateKwmConnection);
		}));
	}
	return defaultStateKwmConnection;
}

export const executeDefaultState = (defaultStateId) => {
	var defaultState = db.defaultStates.get(defaultStateId);
	db.defaultStateVideoConnections.filter(p => p.defaultStateId === defaultStateId).forEach(defaultStateVideoConnection => {
		defaultStateVideoConnection.conPort.setValue(defaultStateVideoConnection.cpuPort.portNum);
	});
	db.defaultStateKwmConnections.filter(p => p.defaultStateId === defaultStateId).forEach(defaultStateKwmConnection => {
		defaultStateKwmConnection.cpuPort.setValue(defaultStateKwmConnection.conPort.portNum);
	});
	if (defaultState) {
		setTimeout(() => {
			defaultState.matrix.requestAllStates();
		}, 100)
	} 
}

export const createWeeklyTimer = (slug) => {
	var weeklyTimer;
	setDb(db.withMutations(db => {
		var id = db.nextWeeklyTimerId++;
		weeklyTimer = new WeeklyTimer({
			id,
			slug
		});
		db.weeklyTimers = db.weeklyTimers.set(id, weeklyTimer);
	}));
	return weeklyTimer;
}

export const addVideoConnectionToWeeklyTimer = (weeklyTimerId, conPortId, cpuPortId) => {
	var weeklyTimerVideoConnection;
	if (db.weeklyTimers.has(weeklyTimerId) &&
	    db.conPorts.has(conPortId) && db.cpuPorts.has(cpuPortId) &&
		!db.weeklyTimerVideoConnections.some(p => p.weeklyTimerId === weeklyTimerId && p.conPortId === conPortId && p.cpuPortId === cpuPortId)) {
		setDb(db.withMutations(db => {
			var id = db.nextWeeklyTimerVideoConnectionId++;
			weeklyTimerVideoConnection = new WeeklyTimerVideConnection({
				id,
				weeklyTimerId,
				conPortId,
				cpuPortId
			});
			db.weeklyTimerVideoConnections = db.weeklyTimerVideoConnections.set(id, weeklyTimerVideoConnection);
		}));
	}
	return weeklyTimerVideoConnection;
}

export const addKwmConnectionToWeeklyTimer = (weeklyTimerId, conPortId, cpuPortId) => {
	var weeklyTimerKwmConnection;
	if (db.weeklyTimers.has(weeklyTimerId) &&
	    db.conPorts.has(conPortId) && db.cpuPorts.has(cpuPortId)) {
		setDb(db.withMutations(db => {
			var id = db.nextWeeklyTimerKwmConnectionId++;
			weeklyTimerKwmConnection = new WeeklyTimerKwmConnection({
				id,
				weeklyTimerId,
				conPortId,
				cpuPortId
			});
			db.weeklyTimerKwmConnections = db.weeklyTimerKwmConnections.set(id, weeklyTimerKwmConnection);
		}));
	}
	return weeklyTimerKwmConnection;
}

export const addDefaultStateToWeeklyTimer = (weeklyTimerId, defaultStateId) => {
	var weeklyTimerDefaultState;
	if (db.weeklyTimers.has(weeklyTimerId) &&
		db.defaultStates.has(defaultStateId) &&
		!db.weeklyTimerDefaultStates.some(p => p.weeklyTimerId === weeklyTimerId && p.defaultStateId === defaultStateId)) {
		setDb(db.withMutations(db => {
			var id = db.nextWeeklyTimerDefaultStateId++;
			weeklyTimerDefaultState = new WeeklyTimerDefaultState({
				id,
				weeklyTimerId,
				defaultStateId
			});
			db.weeklyTimerDefaultStates = db.weeklyTimerDefaultStates.set(id, weeklyTimerDefaultState);
		}));
	}
	return weeklyTimerDefaultState;
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

		db.defaultStateKwmConnections = db.defaultStateKwmConnections.filterNot(p => 
		db.conPorts.filter(f => f.matrixId === id).some(e => e.id === p.conPortId) ||
		db.cpuPorts.filter(f => f.matrixId === id).some(e => e.id === p.cpuPortId));

		db.defaultStateVideoConnections = db.defaultStateVideoConnections.filterNot(p => 
		db.conPorts.filter(f => f.matrixId === id).some(e => e.id === p.conPortId) ||
		db.cpuPorts.filter(f => f.matrixId === id).some(e => e.id === p.cpuPortId));

		db.diagramScreens = db.diagramScreens.filterNot(p => 
		p.matrixId === id || db.conPorts.filter(f => f.matrixId === id).some(e => e.id === p.conPortId));

		db.diagramScreenCpuPorts = db.diagramScreenCpuPorts.filterNot(p => 
		db.cpuPorts.filter(f => f.matrixId === id).some(e => e.id === p.cpuPortId));

		db.weeklyTimerKwmConnections = db.weeklyTimerKwmConnections.filterNot(p => 
		db.conPorts.filter(f => f.matrixId === id).some(e => e.id === p.conPortId) ||
		db.cpuPorts.filter(f => f.matrixId === id).some(e => e.id === p.cpuPortId));

		db.weeklyTimerVideoConnections = db.weeklyTimerVideoConnections.filterNot(p => 
		db.conPorts.filter(f => f.matrixId === id).some(e => e.id === p.conPortId) ||
		db.cpuPorts.filter(f => f.matrixId === id).some(e => e.id === p.cpuPortId));

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
		db.defaultStates = db.defaultStates.filterNot(p => p.matrixId === id);
	}));
}

export const listen = (port) => {
	tcpServer.listen(port);
}

export const on = (eventType, callback) => {
	emitter.on(eventType, callback);
}