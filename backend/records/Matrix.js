
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


var connections = {};
var emitters = {};

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
			console.log("setting video connection", 128+con, 128+cpu);
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

	setKwmConnection(con, cpu) {
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
                client.connect(port, ip, () => {
					connections[id] = client
					setTimeout(() => {
						delete connections[id];
                        delete emitters[id];
					}, 60000);
                    client.on("data", (data) => {
                        console.log("Viesti matriisilta", data);
                        if (data[0] === 2) {
                            switch(data[1]) {
                                case SET_KWM_CONNECTION:
                                    emitter.emit("SET_KWM_CONNECTION", data[3]-128, data[2]-128);
                                    console.log("kwm connection setted");
                                    break;
                                case SET_VIDEO_CONNECTION:
                                    emitter.emit("SET_VIDEO_CONNECTION", data[2]-128, data[3]-128);
                                    console.log("video connections setted");
                                    break;
                                case TURN_OFF_CON_PORT:
                                    emitter.emit("TURN_OFF_CON_PORT", data[2]-128);
                                    console.log("tunr off con");
                                    break;
                                case TURN_OFF_CPU_PORT:
                                    emitter.emit("TURN_OFF_CPU_PORT", data[2]-128);
                                    console.log("turn off cpu");
                                    break;
                                case REQUEST_ALL_STATES:
                                    var conConnections = [];
                                    var cpuConnections = [];
                                    for (var i = 2; i < 3 + numberOfConPorts;i++) {
                                        conConnections.push({
                                            con: i - 1,
                                            cpu: data[i]-128
                                        });
                                    }
                                    for (var i = 3 + numberOfConPorts; i < 3 + numberOfConPorts + numberOfCpuPorts; i++) {
                                        cpuConnections.push({
                                            con: data[i] -128,
                                            cpu: i - (2 + numberOfConPorts)
                                        });
                                    }

                                    emitter.emit("REQUEST_ALL_STATES", conConnections, cpuConnections);
                                    console.log("request allstates");
                                    break;
                            }
                        }
                    });
					resolve(client);
				});
			}
		}
	});
}