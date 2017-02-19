var net = require('net');

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

export default class {
	constructor() {
		this.tcpServer = net.createServer(function (socket) {
			socket.write('Echo server\r\n');
			socket.pipe(socket);
			socket.on("data", function (data) {
				console.log('Received: ' + data);
				//server.destroy(); // kill client after server's response
			});
		});
		this.db = new TaistoDb();
		
	}

	connectMarix(ip, port, slug, numberOfConPorts, numberOfCpuPorts) {
		var id = matrixId++;
		this.db = this.db.withMutations(db => {
			var matrix = new Matrix({
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
			console.log(db.toJS());
		});

		
	}

	listen(port) {
		this.tcpServer.listen(port);
	}
}