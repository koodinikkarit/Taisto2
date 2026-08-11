var net = require("net");
var events = require("events");

import crypto from "crypto";
import {
	initializeDatabaseStorage,
	saveDatabase,
	exportDatabaseToJson,
	getSqlitePath
} from "./storage/SqliteStorage";

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
import ConGroup from "./records/ConGroup";

import { Map } from "immutable";

var db = new TaistoDb();

var emitter = (emitter = new events.EventEmitter());
var currentVideoConnections = {};
var currentKwmConnections = {};

export { db };

var tcpServer = net.createServer(function(socket) {
	socket.write("Echo server\r\n");
	socket.pipe(socket);
	socket.on("data", function(data) {
		//server.destroy(); // kill client after server's response
	});
});

var saveScheduled = false;

const loadedDatabase = initializeDatabaseStorage({
	sqlitePath: "./database/taisto.sqlite",
	jsonPath: "./database/database.json"
});

if (loadedDatabase) {
		db = db.withMutations(db => {
			db.nextMatrixId = loadedDatabase.nextMatrixId
				? loadedDatabase.nextMatrixId
				: 1;
			db.nextConPortId = loadedDatabase.nextConPortId
				? loadedDatabase.nextConPortId
				: 1;
			db.nextCpuPortId = loadedDatabase.nextCpuPortId
				? loadedDatabase.nextCpuPortId
				: 1;
			db.nextDiagramId = loadedDatabase.nextDiagramId
				? loadedDatabase.nextDiagramId
				: 1;
			db.nextDiagramScreenId = loadedDatabase.nextDiagramScreenId
				? loadedDatabase.nextDiagramScreenId
				: 1;
			db.nextDiagramScreenCpuPortId = loadedDatabase.nextDiagramScreenCpuPortId
				? loadedDatabase.nextDiagramScreenCpuPortId
				: 1;
			db.nextDefaultStateId = loadedDatabase.nextDefaultStateId
				? loadedDatabase.nextDefaultStateId
				: 1;
			db.nextDefaultStateVideoConnectionId = loadedDatabase.nextDefaultStateVideoConnectionId
				? loadedDatabase.nextDefaultStateVideoConnectionId
				: 1;
			db.nextDefaultStateKwmConnectionId = loadedDatabase.nextDefaultStateKwmConnectionId
				? loadedDatabase.nextDefaultStateKwmConnectionId
				: 1;
			db.nextWeeklyTimerId = loadedDatabase.nextWeeklyTimerId
				? loadedDatabase.nextWeeklyTimerId
				: 1;
			db.nextWeeklyTimerVideoConnectionId = loadedDatabase.nextWeeklyTimerVideoConnectionId
				? loadedDatabase.nextWeeklyTimerVideoConnectionId
				: 1;
			db.nextWeeklyTimerKwmConnectionId = loadedDatabase.nextWeeklyTimerKwmConnectionId
				? loadedDatabase.nextWeeklyTimerKwmConnectionId
				: 1;
			db.nextWeeklyTimerDefaultStateId = loadedDatabase.nextWeeklyTimerDefaultStateId
				? loadedDatabase.nextWeeklyTimerDefaultStateId
				: 1;
			db.nextConGroupId = loadedDatabase.nextConGroupId
				? loadedDatabase.nextConGroupId
				: 1;
			db.restApiKeys = Array.isArray(loadedDatabase.restApiKeys)
				? loadedDatabase.restApiKeys.map(key => Object.assign({ enabled: true, name: "Nimetön avain", useCount: 0, lastUsedAt: "" }, key))
				: [];
			db.restApiAnonymousUntil = loadedDatabase.restApiAnonymousUntil || "";

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
						conPorts.set(
							parseInt(id),
							new ConPort(loadedDatabase.conPorts[id])
						);
					});
				});
			}
			if (loadedDatabase.cpuPorts) {
				db.cpuPorts = db.cpuPorts.withMutations(cpuPorts => {
					Object.keys(loadedDatabase.cpuPorts).forEach(id => {
						cpuPorts.set(
							parseInt(id),
							new CpuPort(loadedDatabase.cpuPorts[id])
						);
					});
				});
			}
			if (loadedDatabase.diagrams) {
				db.diagrams = db.diagrams.withMutations(diagrams => {
					Object.keys(loadedDatabase.diagrams).forEach(id => {
						diagrams.set(
							parseInt(id),
							new Diagram(loadedDatabase.diagrams[id])
						);
					});
				});
			}
			if (loadedDatabase.diagramScreens) {
				db.diagramScreens = db.diagramScreens.withMutations(
					diagramScreens => {
						Object.keys(loadedDatabase.diagramScreens).forEach(
							id => {
								diagramScreens.set(
									parseInt(id),
									new DiagramScreen(
										loadedDatabase.diagramScreens[id]
									)
								);
							}
						);
					}
				);
			}
			if (loadedDatabase.diagramScreenCpuPorts) {
				db.diagramScreenCpuPorts = db.diagramScreenCpuPorts.withMutations(
					diagramScreenCpuPorts => {
						Object.keys(
							loadedDatabase.diagramScreenCpuPorts
						).forEach(id => {
							diagramScreenCpuPorts.set(
								parseInt(id),
								new DiagramScreenCpuPort(
									loadedDatabase.diagramScreenCpuPorts[id]
								)
							);
						});
					}
				);
			}
			if (loadedDatabase.defaultStates) {
				db.defaultStates = db.defaultStates.withMutations(
					defaultStates => {
						Object.keys(loadedDatabase.defaultStates).forEach(
							id => {
								defaultStates.set(
									parseInt(id),
									new DefaultState(
										loadedDatabase.defaultStates[id]
									)
								);
							}
						);
					}
				);
			}
			if (loadedDatabase.defaultStateVideoConnections) {
				db.defaultStateVideoConnections = db.defaultStateVideoConnections.withMutations(
					defaultStateVideoConnections => {
						Object.keys(
							loadedDatabase.defaultStateVideoConnections
						).forEach(id => {
							defaultStateVideoConnections.set(
								parseInt(id),
								new DefaultStateVideoConnection(
									loadedDatabase.defaultStateVideoConnections[
										id
									]
								)
							);
						});
					}
				);
			}
			if (loadedDatabase.defaultStateKwmConnections) {
				db.defaultStateKwmConnections = db.defaultStateKwmConnections.withMutations(
					defaultStateKwmConnections => {
						Object.keys(
							loadedDatabase.defaultStateKwmConnections
						).forEach(id => {
							defaultStateKwmConnections.set(
								parseInt(id),
								new DefaultStateKwmConnection(
									loadedDatabase.defaultStateKwmConnections[
										id
									]
								)
							);
						});
					}
				);
			}
			if (loadedDatabase.weeklyTimers) {
				db.weeklyTimers = db.weeklyTimers.withMutations(
					weeklyTimers => {
						Object.keys(loadedDatabase.weeklyTimers).forEach(id => {
							weeklyTimers.set(
								parseInt(id),
								new WeeklyTimer(loadedDatabase.weeklyTimers[id])
							);
						});
					}
				);
			}
			if (loadedDatabase.weeklyTimerVideoConnections) {
				db.weeklyTimerVideoConnections = db.weeklyTimerVideoConnections.withMutations(
					weeklyTimerVideoConnections => {
						Object.keys(
							loadedDatabase.weeklyTimerVideoConnections
						).forEach(id => {
							weeklyTimerVideoConnections.set(
								parseInt(id),
								new WeeklyTimerVideConnection(
									loadedDatabase.weeklyTimerVideoConnections[
										id
									]
								)
							);
						});
					}
				);
			}
			if (loadedDatabase.weeklyTimerKwmConnections) {
				db.weeklyTimerKwmConnections = db.weeklyTimerKwmConnections.withMutations(
					weeklyTimerKwmConnections => {
						Object.keys(
							loadedDatabase.weeklyTimerKwmConnections
						).forEach(id => {
							weeklyTimerKwmConnections.set(
								parseInt(id),
								new WeeklyTimerKwmConnection(
									loadedDatabase.weeklyTimerKwmConnections[id]
								)
							);
						});
					}
				);
			}
			if (loadedDatabase.weeklyTimerDefaultStates) {
				db.weeklyTimerDefaultStates = db.weeklyTimerDefaultStates.withMutations(
					weeklyTimerDefaultStates => {
						Object.keys(
							loadedDatabase.weeklyTimerDefaultStates
						).forEach(id => {
							weeklyTimerDefaultStates.set(
								parseInt(id),
								new WeeklyTimerDefaultState(
									loadedDatabase.weeklyTimerDefaultStates[id]
								)
							);
						});
					}
				);
			}
			if (loadedDatabase.conGroups) {
				db.conGroups = db.conGroups.withMutations(conGroups => {
					Object.keys(loadedDatabase.conGroups).forEach(id => {
						conGroups.set(parseInt(id), new ConGroup(loadedDatabase.conGroups[id]));
					});
				});
			}
		});
		db.matrixs.forEach(matrix => {
			registerMatrixEvents(matrix);
		});
		initializeMockMatrixStates();
	}

export const setDb = newDatabase => {
	if (newDatabase !== db) {
		db = newDatabase;
		if (!saveScheduled) {
			setTimeout(() => {
				try {
					saveDatabase(JSON.parse(JSON.stringify(db)));
					console.log("saved to sqlite");
				} catch (error) {
					console.log("error while saving", error);
				} finally {
					saveScheduled = false;
				}
			}, 2000);
			saveScheduled = true;
		}
	}
};

export const connectMarix = (
	ip,
	port,
	slug,
	numberOfConPorts,
	numberOfCpuPorts
) => {
	var matrix;
	setDb(
		db.withMutations(db => {
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
					conPorts.set(
						conId,
						new ConPort({
							id: conId,
							portNum: i + 1,
							matrixId: id
						})
					);
				}
			});
			db.cpuPorts = db.cpuPorts.withMutations(cpuPorts => {
				for (var i = 0; i < numberOfCpuPorts; i++) {
					var cpuId = db.nextCpuPortId++;
					cpuPorts.set(
						cpuId,
						new CpuPort({
							id: cpuId,
							portNum: i + 1,
							matrixId: id
						})
					);
				}
			});
			registerMatrixEvents(matrix);
		})
	);
	return matrix;
};

export const createDiagram = slug => {
	var diagram;
	setDb(
		db.withMutations(db => {
			var id = db.nextDiagramId++;
			diagram = new Diagram({
				id,
				slug
			});
			db.diagrams = db.diagrams.withMutations(diagrams => {
				diagrams.set(id, diagram);
			});
		})
	);
	return diagram;
};

export const createDiagramScreen = (diagramId, slug, matrixId, conPortId) => {
	var diagramScreen;
	setDb(
		db.withMutations(db => {
			var id = db.nextDiagramScreenId++;
			diagramScreen = new DiagramScreen({
				id,
				diagramId,
				slug,
				conPortId,
				matrixId
			});
			db.diagramScreens = db.diagramScreens.set(id, diagramScreen);
		})
	);
	return diagramScreen;
};

export const addCpuToDiagramScreen = (diagramScreenId, cpuPortId) => {
	var diagramScreen = db.diagramScreens.get(diagramScreenId);
	var diagramScreenCpu;
	if (diagramScreen) {
		setDb(
			db.withMutations(db => {
				var id = db.nextDiagramScreenCpuPortId++;
				diagramScreenCpu = new DiagramScreenCpuPort({
					id,
					diagramScreenId,
					cpuPortId
				});
				db.diagramScreenCpuPorts = db.diagramScreenCpuPorts.set(
					id,
					diagramScreenCpu
				);
			})
		);
	}
	return diagramScreenCpu;
};

export const createDefaultState = (slug, matrixId) => {
	var defaultState;
	setDb(
		db.withMutations(db => {
			var id = db.nextDefaultStateId++;
			defaultState = new DefaultState({
				id,
				slug,
				matrixId
			});
			db.defaultStates = db.defaultStates.set(id, defaultState);
		})
	);
	return defaultState;
};

export const insertVideoConnectionToDefaultState = (
	defaultStateId,
	conPortId,
	cpuPortId
) => {
	var defaultState = db.defaultStates.get(defaultStateId);
	var defaultStateVideoConnection;
	if (defaultState) {
		defaultStateVideoConnection = db.defaultStateVideoConnections.find(
			p =>
				p.defaultStateId === defaultStateId && p.conPortId === conPortId
		);
		setDb(
			db.withMutations(db => {
				var id;
				if (defaultStateVideoConnection) {
					id = defaultStateVideoConnection.id;
					defaultStateVideoConnection = defaultStateVideoConnection.set(
						"cpuPortId",
						cpuPortId
					);
				} else {
					id = db.nextDefaultStateVideoConnectionId++;
					defaultStateVideoConnection = new DefaultStateVideoConnection(
						{
							id,
							defaultStateId,
							conPortId,
							cpuPortId
						}
					);
				}
				db.defaultStateVideoConnections = db.defaultStateVideoConnections.set(
					id,
					defaultStateVideoConnection
				);
			})
		);
	}
	return defaultStateVideoConnection;
};

export const insertKwmConnectionToDefaultState = (
	defaultStateId,
	conPortId,
	cpuPortId
) => {
	var defaultState = db.defaultStates.get(defaultStateId);
	var defaultStateKwmConnection;
	if (defaultState) {
		defaultStateKwmConnection = db.defaultStateKwmConnections.find(
			p =>
				p.defaultStateId === defaultStateId && p.cpuPortId === cpuPortId
		);
		setDb(
			db.withMutations(db => {
				var id;
				if (defaultStateKwmConnection) {
					id = defaultStateKwmConnection.id;
					defaultStateKwmConnection = defaultStateKwmConnection.set(
						"conPortId",
						conPortId
					);
				} else {
					id = db.nextDefaultStateKwmConnectionId++;
					defaultStateKwmConnection = new DefaultStateKwmConnection({
						id,
						defaultStateId,
						conPortId,
						cpuPortId
					});
				}
				db.defaultStateKwmConnections = db.defaultStateKwmConnections.set(
					id,
					defaultStateKwmConnection
				);
			})
		);
	}
	return defaultStateKwmConnection;
};

export const executeDefaultState = defaultStateId => {
	var defaultState = db.defaultStates.get(defaultStateId);
	db.defaultStateVideoConnections
		.filter(p => p.defaultStateId === defaultStateId)
		.forEach((defaultStateVideoConnection, i) => {
			setTimeout(() => {
				defaultStateVideoConnection.execute();
			}, 10 * i);
		});
	db.defaultStateKwmConnections
		.filter(p => p.defaultStateId === defaultStateId)
		.forEach((defaultStateKwmConnection, i) => {
			setTimeout(() => {
				defaultStateKwmConnection.execute();
			}, 10 * i);
		});
	if (defaultState) {
		setTimeout(() => {
			defaultState.matrix.requestAllStates();
		}, 300);
	}
};

export const exportDatabase = outputPath => exportDatabaseToJson(outputPath);
export const getDatabasePath = () => getSqlitePath();

export const getRestApiKeyStatus = () => ({
	configured: db.restApiKeys.length > 0,
	keys: db.restApiKeys.map(key => Object.assign({}, key)),
	anonymousUntil: db.restApiAnonymousUntil || "",
	anonymousActive: Boolean(db.restApiAnonymousUntil && new Date(db.restApiAnonymousUntil).getTime() > Date.now())
});

export const createRestApiKey = (name, expiresInDays) => {
	const apiKey = `taisto_${crypto.randomBytes(32).toString("base64url")}`;
	const days = Number(expiresInDays);
	const expiresAt = Number.isFinite(days) && days > 0
		? new Date(Date.now() + Math.min(days, 3650) * 24 * 60 * 60 * 1000).toISOString()
		: "";
	const key = {
		id: crypto.randomBytes(12).toString("hex"),
		key: apiKey,
		name: String(name || "").trim().slice(0, 80) || "Nimetön avain",
		createdAt: new Date().toISOString(),
		expiresAt,
		enabled: true,
		useCount: 0,
		lastUsedAt: ""
	};
	setDb(db.set("restApiKeys", db.restApiKeys.concat(key)));
	return key;
};

export const revokeRestApiKey = id => {
	const nextKeys = db.restApiKeys.filter(key => key.id !== id);
	if (nextKeys.length === db.restApiKeys.length) return false;
	setDb(db.set("restApiKeys", nextKeys));
	return true;
};

export const setRestApiKeyEnabled = (id, enabled) => {
	const index = db.restApiKeys.findIndex(key => key.id === id);
	if (index === -1) return null;
	const nextKeys = db.restApiKeys.map(key => key.id === id ? Object.assign({}, key, { enabled: Boolean(enabled) }) : key);
	setDb(db.set("restApiKeys", nextKeys));
	return nextKeys[index];
};

export const setRestApiKeyName = (id, name) => {
	const index = db.restApiKeys.findIndex(key => key.id === id);
	if (index === -1) return null;
	const normalizedName = String(name || "").trim().slice(0, 80) || "Nimetön avain";
	const nextKeys = db.restApiKeys.map(key => key.id === id ? Object.assign({}, key, { name: normalizedName }) : key);
	setDb(db.set("restApiKeys", nextKeys));
	return nextKeys[index];
};

export const setRestApiKeyExpiration = (id, expiresAt) => {
	const index = db.restApiKeys.findIndex(key => key.id === id);
	if (index === -1) return null;
	let normalizedExpiration = "";
	if (expiresAt) {
		const timestamp = new Date(expiresAt).getTime();
		if (!Number.isFinite(timestamp)) return false;
		normalizedExpiration = new Date(timestamp).toISOString();
	}
	const nextKeys = db.restApiKeys.map(key => key.id === id ? Object.assign({}, key, { expiresAt: normalizedExpiration }) : key);
	setDb(db.set("restApiKeys", nextKeys));
	return nextKeys[index];
};

export const allowAnonymousRestApi = durationMinutes => {
	const minutes = Number(durationMinutes);
	if (!Number.isFinite(minutes) || minutes < 1 || minutes > 43200) return null;
	const anonymousUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
	setDb(db.set("restApiAnonymousUntil", anonymousUntil));
	return anonymousUntil;
};

export const disableAnonymousRestApi = () => {
	setDb(db.set("restApiAnonymousUntil", ""));
};

export const authenticateRestApiKey = apiKey => {
	if (!apiKey) return null;
	const validKey = db.restApiKeys.find(entry => {
		if (entry.enabled === false) return false;
		if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= Date.now()) return false;
		const actual = Buffer.from(apiKey);
		const expected = Buffer.from(entry.key || "");
		return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
	});
	if (!validKey) return null;
	const nextKeys = db.restApiKeys.map(entry => entry.id === validKey.id
		? Object.assign({}, entry, { useCount: Number(entry.useCount || 0) + 1, lastUsedAt: new Date().toISOString() })
		: entry);
	setDb(db.set("restApiKeys", nextKeys));
	return { id: validKey.id, name: validKey.name || "NimetÃ¶n avain" };
};

export const validateRestApiKey = apiKey => Boolean(authenticateRestApiKey(apiKey));

export const createConGroup = (slug, matrixId, conPortIds) => {
	let conGroup;
	setDb(db.withMutations(database => {
		const id = database.nextConGroupId++;
		conGroup = new ConGroup({ id, slug, matrixId, conPortIds });
		database.conGroups = database.conGroups.set(id, conGroup);
	}));
	return conGroup;
};

export const updateConGroup = (id, slug, conPortIds) => {
	let conGroup = db.conGroups.get(id);
	if (!conGroup) return null;
	conGroup = conGroup.withMutations(group => {
		if (slug != null) group.slug = slug;
		if (conPortIds != null) group.conPortIds = conPortIds;
	});
	setDb(db.set("conGroups", db.conGroups.set(id, conGroup)));
	return conGroup;
};

export const removeConGroup = id => {
	if (!db.conGroups.has(id)) return false;
	setDb(db.set("conGroups", db.conGroups.delete(id)));
	return true;
};

export const executeConGroup = (id, cpuPortId) => {
	const group = db.conGroups.get(id);
	const cpuPort = db.cpuPorts.get(cpuPortId);
	if (!group || !cpuPort || cpuPort.matrixId !== group.matrixId) return false;
	const conPorts = group.conPorts;
	if (!conPorts.length || conPorts.some(conPort => conPort.matrixId !== group.matrixId)) return false;
	conPorts.forEach((conPort, index) => {
		setTimeout(() => conPort.setValue(cpuPort.id), index * 10);
	});
	setTimeout(() => group.matrix.requestAllStates(), Math.max(300, conPorts.length * 10 + 50));
	return true;
};

export const createWeeklyTimer = slug => {
	var weeklyTimer;
	setDb(
		db.withMutations(db => {
			var id = db.nextWeeklyTimerId++;
			weeklyTimer = new WeeklyTimer({
				id,
				slug
			});
			db.weeklyTimers = db.weeklyTimers.set(id, weeklyTimer);
		})
	);
	return weeklyTimer;
};

export const addVideoConnectionToWeeklyTimer = (
	weeklyTimerId,
	conPortId,
	cpuPortId
) => {
	var weeklyTimerVideoConnection;
	if (
		db.weeklyTimers.has(weeklyTimerId) &&
		db.conPorts.has(conPortId) &&
		db.cpuPorts.has(cpuPortId) &&
		!db.weeklyTimerVideoConnections.some(
			p =>
				p.weeklyTimerId === weeklyTimerId &&
				p.conPortId === conPortId &&
				p.cpuPortId === cpuPortId
		)
	) {
		setDb(
			db.withMutations(db => {
				var id = db.nextWeeklyTimerVideoConnectionId++;
				weeklyTimerVideoConnection = new WeeklyTimerVideConnection({
					id,
					weeklyTimerId,
					conPortId,
					cpuPortId
				});
				db.weeklyTimerVideoConnections = db.weeklyTimerVideoConnections.set(
					id,
					weeklyTimerVideoConnection
				);
			})
		);
	}
	return weeklyTimerVideoConnection;
};

export const addKwmConnectionToWeeklyTimer = (
	weeklyTimerId,
	conPortId,
	cpuPortId
) => {
	var weeklyTimerKwmConnection;
	if (
		db.weeklyTimers.has(weeklyTimerId) &&
		db.conPorts.has(conPortId) &&
		db.cpuPorts.has(cpuPortId)
	) {
		setDb(
			db.withMutations(db => {
				var id = db.nextWeeklyTimerKwmConnectionId++;
				weeklyTimerKwmConnection = new WeeklyTimerKwmConnection({
					id,
					weeklyTimerId,
					conPortId,
					cpuPortId
				});
				db.weeklyTimerKwmConnections = db.weeklyTimerKwmConnections.set(
					id,
					weeklyTimerKwmConnection
				);
			})
		);
	}
	return weeklyTimerKwmConnection;
};

export const addDefaultStateToWeeklyTimer = (weeklyTimerId, defaultStateId) => {
	var weeklyTimerDefaultState;
	if (
		db.weeklyTimers.has(weeklyTimerId) &&
		db.defaultStates.has(defaultStateId) &&
		!db.weeklyTimerDefaultStates.some(
			p =>
				p.weeklyTimerId === weeklyTimerId &&
				p.defaultStateId === defaultStateId
		)
	) {
		setDb(
			db.withMutations(db => {
				var id = db.nextWeeklyTimerDefaultStateId++;
				weeklyTimerDefaultState = new WeeklyTimerDefaultState({
					id,
					weeklyTimerId,
					defaultStateId
				});
				db.weeklyTimerDefaultStates = db.weeklyTimerDefaultStates.set(
					id,
					weeklyTimerDefaultState
				);
			})
		);
	}
	return weeklyTimerDefaultState;
};

function registerMatrixEvents(matrix) {
	var id = matrix.id;
	matrix.on("REQUEST_ALL_STATES", requestAllStates);
	matrix.on("SET_KWM_CONNECTION", setKwmConnection);
	matrix.on("SET_VIDEO_CONNECTION", setVideoConnection);
	matrix.on("TURN_OFF_CON_PORT", turnOffConPort);
	matrix.on("TURN_OFF_CPU_PORT", turnOffCpuPort);
	matrix.on("MATRIX_CONNECTION_STATE_CHANGED", matrixConnectionStateChanged);

	function requestAllStates(videoConnections, kwmConnections) {
		if (matrix.mock) {
			videoConnections = {};
			kwmConnections = {};
			db.conPorts.forEach(conPort => {
				if (conPort.matrixId === id && currentVideoConnections[String(conPort.id)]) {
					videoConnections[String(conPort.id)] = currentVideoConnections[String(conPort.id)];
				}
			});
			db.cpuPorts.forEach(cpuPort => {
				if (cpuPort.matrixId === id && currentKwmConnections[String(cpuPort.id)]) {
					kwmConnections[String(cpuPort.id)] = currentKwmConnections[String(cpuPort.id)];
				}
			});
		}
		if (db.matrixs.has(id)) {
			if (videoConnections) {
				currentVideoConnections = Object.assign(
					currentVideoConnections,
					videoConnections
				);
			}
			if (kwmConnections) {
				currentKwmConnections = Object.assign(
					currentKwmConnections,
					kwmConnections
				);
			}
			emitter.emit("NEW_VIDEO_CONNECTIONS", videoConnections);
			emitter.emit("NEW_KWM_CONNECTIONS", kwmConnections);
		}
	}
	function setKwmConnection(cpuPortNum, conPortNum) {
		if (db.matrixs.has(id)) {
			var conPort = db.conPorts.find(
				p => p.matrixId === id && p.portNum === conPortNum
			);
			var cpuPort = db.cpuPorts.find(
				p => p.matrixId === id && p.portNum === cpuPortNum
			);
			if (cpuPort && conPort) {
				currentKwmConnections[String(cpuPort.id)] = String(conPort.id);
			}
			emitter.emit(
				"NEW_KWM_CONNECTION",
				String(cpuPort.id),
				String(conPort.id)
			);
		}
	}
	function setVideoConnection(conPortNum, cpuPortNum) {
		if (db.matrixs.has(id)) {
			var conPort = db.conPorts.find(
				p => p.matrixId === id && p.portNum === conPortNum
			);
			var cpuPort = db.cpuPorts.find(
				p => p.matrixId === id && p.portNum === cpuPortNum
			);
			if (conPort && cpuPort) {
				currentVideoConnections[String(conPort.id)] = String(cpuPort.id);
				emitter.emit(
					"NEW_VIDEO_CONNECTION",
					String(conPort.id),
					String(cpuPort.id)
				);
			} else {
				console.log("conPort or cpuPort null", conPort, cpuPort);
			}
		}
	}
	function turnOffConPort(conPortNum) {
		if (db.matrixs.has(id)) {
			var conPort = db.conPorts.find(
				p => p.matrixId === id && p.portNum === conPortNum
			);
			if (conPort) {
				currentVideoConnections[String(conPort.id)] = 0;
			}
			emitter.emit("TURN_OFF_CON_PORT", String(conPort.id));
		}
	}
	function turnOffCpuPort(cpuPortNum) {
		if (db.matrixs.has(id)) {
			var cpuPort = db.cpuPorts.find(
				p => p.matrixId === id && p.portNum === cpuPortNum
			);
			if (cpuPort) {
				currentKwmConnections[String(cpuPort.id)] = 0;
			}
			emitter.emit("TURN_OFF_CPU_PORT", String(cpuPort.id));
		}
	}
	function matrixConnectionStateChanged(reason, id, ip, port) {
		if (db.matrixs.has(id)) {
			emitter.emit(
				"MATRIX_CONNECTION_STATE_CHANGED",
				reason,
				String(id),
				ip,
				port
			);
		}
	}

	matrix.requestAllStates();
}

function initializeMockMatrixStates() {
	db.defaultStateVideoConnections.forEach(connection => {
		const conPort = db.conPorts.get(connection.conPortId);
		const cpuPort = db.cpuPorts.get(connection.cpuPortId);
		const matrix = conPort && db.matrixs.get(conPort.matrixId);
		if (matrix && matrix.mock && cpuPort && cpuPort.matrixId === matrix.id) {
			currentVideoConnections[String(conPort.id)] = String(cpuPort.id);
		}
	});
	db.defaultStateKwmConnections.forEach(connection => {
		const conPort = db.conPorts.get(connection.conPortId);
		const cpuPort = db.cpuPorts.get(connection.cpuPortId);
		const matrix = cpuPort && db.matrixs.get(cpuPort.matrixId);
		if (matrix && matrix.mock && conPort && conPort.matrixId === matrix.id) {
			currentKwmConnections[String(cpuPort.id)] = String(conPort.id);
		}
	});
}

export const removeMatrix = id => {
	setDb(
		db.withMutations(db => {
			var matrix = db.matrixs.get(id);
			if (matrix) matrix.destroy();
			db.matrixs = db.matrixs.delete(id);
			db.conGroups = db.conGroups.filterNot(group => group.matrixId === id);

			db.defaultStateKwmConnections = db.defaultStateKwmConnections.filterNot(
				p =>
					db.conPorts
						.filter(f => f.matrixId === id)
						.some(e => e.id === p.conPortId) ||
					db.cpuPorts
						.filter(f => f.matrixId === id)
						.some(e => e.id === p.cpuPortId)
			);

			db.defaultStateVideoConnections = db.defaultStateVideoConnections.filterNot(
				p =>
					db.conPorts
						.filter(f => f.matrixId === id)
						.some(e => e.id === p.conPortId) ||
					db.cpuPorts
						.filter(f => f.matrixId === id)
						.some(e => e.id === p.cpuPortId)
			);

			db.diagramScreens = db.diagramScreens.filterNot(
				p =>
					p.matrixId === id ||
					db.conPorts
						.filter(f => f.matrixId === id)
						.some(e => e.id === p.conPortId)
			);

			db.diagramScreenCpuPorts = db.diagramScreenCpuPorts.filterNot(p =>
				db.cpuPorts
					.filter(f => f.matrixId === id)
					.some(e => e.id === p.cpuPortId)
			);

			db.weeklyTimerKwmConnections = db.weeklyTimerKwmConnections.filterNot(
				p =>
					db.conPorts
						.filter(f => f.matrixId === id)
						.some(e => e.id === p.conPortId) ||
					db.cpuPorts
						.filter(f => f.matrixId === id)
						.some(e => e.id === p.cpuPortId)
			);

			db.weeklyTimerVideoConnections = db.weeklyTimerVideoConnections.filterNot(
				p =>
					db.conPorts
						.filter(f => f.matrixId === id)
						.some(e => e.id === p.conPortId) ||
					db.cpuPorts
						.filter(f => f.matrixId === id)
						.some(e => e.id === p.cpuPortId)
			);

			db.weeklyTimerDefaultStates = db.weeklyTimerDefaultStates.filterNot(
				p => p.defaultState.matrixId === id
			);

			db.conPorts = db.conPorts.withMutations(conPorts => {
				conPorts.forEach(conPort => {
					if (conPort.matrixId === id) conPorts.delete(conPort.id);
				});
			});
			db.cpuPorts = db.cpuPorts.withMutations(cpuPorts => {
				cpuPorts.forEach(cpuPort => {
					if (cpuPort.matrixId === id) cpuPorts.delete(cpuPort.id);
				});
			});
			db.defaultStates = db.defaultStates.filterNot(
				p => p.matrixId === id
			);
		})
	);
};

export const listen = port => {
	tcpServer.listen(port);
};

export const on = (eventType, callback) => {
	emitter.on(eventType, callback);
};

export const getVideoConnections = () =>
	Object.assign({}, currentVideoConnections);

export const getKwmConnections = () => Object.assign({}, currentKwmConnections);

export const getVideoConnectionForConPort = conPortId =>
	currentVideoConnections[String(conPortId)];

export const getKwmConnectionForCpuPort = cpuPortId =>
	currentKwmConnections[String(cpuPortId)];
