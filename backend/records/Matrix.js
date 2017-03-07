
import Immutable from "immutable";
const net = require('net');
var events = require('events');

import {
	SET_KWM_CONNECTION,
	SET_VIDEO_CONNECTION,
	REQUEST_ALL_STATES,
	TURN_OFF_CON_PORT,
	TURN_OFF_CPU_PORT
} from "./MatrixCommands";

import {
	db
} from "../TaistoService";


var connections = {};
var emitters = {};

var requestAllStatesPromises = {};

export default class extends Immutable.Record({
	id: null,
	ip: "",
	port: "",
    slug: "",
    numberOfConPorts: 0,
    numberOfCpuPorts: 0
}) {
	constructor(props) {
		super(props);
		var emitter = new events.EventEmitter();
        Object.assign(this, {

        });
	}

	setVideoConnection(con, cpu) {
		createConnection(this.id, this.ip, this.port, this.numberOfConPorts, this.numberOfCpuPorts).then(connection => {
			connection.write(new Buffer([2, SET_VIDEO_CONNECTION, 128+con, 128+cpu, 3]));
		});
	}

	turnOffVideoConnection(con) {
		createConnection(this.id, this.ip, this.port, this.numberOfConPorts, this.numberOfCpuPorts).then(connection => {
			connection.write(new Buffer([2, TURN_OFF_CON_PORT, 128+con, 3]));
		});
	}

	setFullVideoConnections(connections) {
		createConnection(this.id, this.ip, this.port, this.numberOfConPorts, this.numberOfCpuPorts).then(connection => {
			
		});
	}

	turnOffAllVideoConnections() {
		createConnection(this.id, this.ip, this.port).then(connection => {

		});
	}

	setKwmConnection(cpu, con) {
		createConnection(this.id, this.ip, this.port, this.numberOfConPorts, this.numberOfCpuPorts).then(connection => {
			connection.write(new Buffer([2, SET_KWM_CONNECTION, 128+cpu, 128+con, 3]));
		});
	}

	turnOffKwmConnection(cpu) {
		createConnection(this.id, this.ip, this.port, this.numberOfConPorts, this.numberOfCpuPorts).then(connection => {
			connection.write(new Buffer([2, TURN_OFF_CPU_PORT, 128+cpu, 3]));
		});
	}

	setFullKwmConnections(connections) {

	}

	turnOffAllKwmConnections() {

	}

	requestAllStates() {
		createConnection(this.id, this.ip, this.port, this.numberOfConPorts, this.numberOfCpuPorts).then(connection => {
			connection.write(new Buffer([2, REQUEST_ALL_STATES, 3]));
		});
	}

    on(eventType, callback) {
        var emitter = emitters[this.id];
        if (emitter) {
            emitter.on(eventType, callback);
        } else {
            emitter = new events.EventEmitter();
            emitter.on(eventType, callback);
            emitters[this.id] = emitter;
        }
    }

	get conPorts() {
		return db.conPorts.filter(p => p.matrixId === this.id).sort((a, b) => a.portNum - b.portNum);
	}

	get cpuPorts() {
		return db.cpuPorts.filter(p => p.matrixId === this.id).sort((a, b) => a.portNum - b.portNum);
	}
}

function createConnection(id, ip, port, numberOfConPorts, numberOfCpuPorts) {
	return new Promise((resolve, reject) => {
		if (id && ip && port, numberOfConPorts, numberOfCpuPorts) {
			var client = connections[id];
			if (client) resolve(client);
			else {
				client = new net.Socket();
				var emitter = emitters[id];
                if (!emitter) {
                    emitter = new events.EventEmitter();
                    emitters[id] = emitter;
                }   
				try {              
                client.connect(port, ip, () => {
					connections[id] = client
					setTimeout(() => {
						delete connections[id];
					}, 60000);
                    client.on("data", (data) => {
                        if (data[0] === 2) {
                            switch(data[1]) {
                                case SET_KWM_CONNECTION:
                                    emitter.emit("SET_KWM_CONNECTION", data[3]-128, data[2]-128);
                                    break;
                                case SET_VIDEO_CONNECTION:
                                    emitter.emit("SET_VIDEO_CONNECTION", data[2]-128, data[3]-128);
                                    break;
                                case TURN_OFF_CON_PORT:
                                    emitter.emit("TURN_OFF_CON_PORT", data[2]-128);
                                    break;
                                case TURN_OFF_CPU_PORT:
                                    emitter.emit("TURN_OFF_CPU_PORT", data[2]-128);
                                    break;
                                case REQUEST_ALL_STATES:
                                    var conConnections = {}
                                    var cpuConnections = {};
                                    for (var i = 2; i < 2 + numberOfConPorts;i++) {
										var conPort = db.conPorts.find(p => p.matrixId === id && p.portNum === i - 1);
										var cpuPort = db.cpuPorts.find(p => p.matrixId === id && p.portNum === data[i]-128);
										conConnections[String(conPort.id)] = cpuPort ? String(cpuPort.id) : 0;
                                    }
                                    for (var i = 2 + numberOfConPorts; i < 2 + numberOfConPorts + numberOfCpuPorts; i++) {
										var conPort = db.conPorts.find(p => p.matrixId === id && p.portNum === data[i] -128);
										var cpuPort = db.cpuPorts.find(p => p.matrixId === id && p.portNum === i - (1 + numberOfConPorts));
										cpuConnections[String(cpuPort.id)] = conPort ? String(conPort.id) : 0;
                                    }

                                    emitter.emit("REQUEST_ALL_STATES", conConnections, cpuConnections);
                                    break;
                            }
                        }
                    });
					resolve(client);
					emitter.emit("MATRIX_CONNECTION_STATE_CHANGED", "CONNECTED", id, ip, port);
				});
				client.on("close", () => {
					emitter.emit("MATRIX_CONNECTION_STATE_CHANGED", "DISCONNECTED", id, ip, port);
				});

				client.on("error", (err) => {
					switch(err.errno) {
						case "ENOTFOUND":
							emitter.emit("MATRIX_CONNECTION_STATE_CHANGED", "ADDRESS_NOT_FOUND", id, ip, port);
							break;
					}
				});
				} catch(err) {
					console.log("[CONNECTION] connection failed! " + err);
				}
			}
		}
	});
}