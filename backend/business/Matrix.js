import DataSaver from "./DataSaver";
import ConPort from "./ConPort";
import CpuPort from "./CpuPort";

var nextId = 1;

const matrixSaver = new DataSaver({
	path: "matrixs",
	interval: 1000
});

var matrixs = matrixSaver.load();

matrixs.then(matrixs => {
	Object.keys(matrixs).forEach(id => {
		if (id > nextId) nextId = parseInt(id)+1;
	});
});

export default class Matrix {
	static async gen(id) {
		matrixs = await matrixs;
		if (matrixs[id]) return new Matrix(id);
		else return null;
	}

	static async genAll() {
		matrixs = await matrixs;
		var m = [];
		Object.keys(matrixs).forEach(id => {
			m.push(Matrix.gen(id));
		});
		console.log();
		return m;
	}

	static async del(id) {
		matrixs = await matrixs;
		if (matrixs[id]) {
			 matrixs[id].conPorts.forEach(id => {
				 ConPort.del(id);
			 });
			 matrixs[id].cpuPorts.forEach(id => {
				 CpuPort.del(id);
			 });
			 delete matrixs[id];
			 matrixSaver.remove(id);
			 return true;
		} else return false;		
	}

	static async new({slug, ip, port, conPortAmount, cpuPortAmount}) {
		matrixs = await matrixs;
		var id = nextId++;
		var newItem = {
			slug,
			ip,
			port,
			conPortAmount,
			cpuPortAmount,
			conPorts: [],
			cpuPorts: [],
			videoConnections: {},
			kwmConnections: {}
		};
		matrixs[id] = newItem;
		matrixSaver.save(id, newItem);

		for (var i = 0; i < conPortAmount; i++) {
			var newConPort = ConPort.new({
				slug: "",
				matrix: id,
				portNum: i+1
			});
			newConPort = await newConPort;
			newItem.conPorts.push(newConPort.id);
		}

		for (var i = 0; i < cpuPortAmount; i++) {
			var newCpuPort = CpuPort.new({
				slug: "",
				matrix: id,
				portNum: i+1
			});
			newCpuPort = await newCpuPort;
			newItem.cpuPorts.push(newCpuPort.id);
		}
		return new Matrix(id);
	}

	constructor(id) {
		Object.defineProperty(this, "id", {
			get: () => id
		});
	}

	get slug() {
		console.log("get slug", matrixs[this.id].slug);
		return matrixs[this.id].slug;
	}

	get ip() {
		return matrixs[this.id].ip;
	}

	get port() {
		return matrixs[this.id].port;
	}

	get conPortAmount() {
		return matrixs[this.id].conPortAmount;
	}

	get cpuPortAmount() {
		return matrixs[this.id].cpuPortAmount;
	}

	get conPorts() {
		var conPorts = [];
		matrixs[this.id].conPorts.forEach(id => {
			conPorts.push(ConPort.gen(id));
		});
		return conPorts;
	}

	get cpuPorts() {
		var cpuPorts = [];
		matrixs[this.id].cpuPorts.forEach(id => {
			cpuPorts.push(CpuPort.gen(id));
		});
		return cpuPorts;
	}

	set slug(slug) {
		matrixs[this.id].slug = slug;
		matrixSaver.save(this.id, {
			slug
		});
	}

	set ip(ip) {
		matrixs[this.id] = ip;
		matrixSaver.save(this.id, {
			ip
		});
	}

	set port(port) {
		matrixs[this.id].port = port;
		matrixSaver.save(this.id, {
			port
		});
	}
	set conPortAmount(conPortAmount) {
		matrixs[this.id].conPortAmount = conPortAmount;
		matrixSaver.save(this.id, {
			conPortAmount
		});
	}

	set cpuPortAmount(cpuPortAmount) {
		matrixs[this.id].cpuPortAmount = cpuPortAmount;
		matrixSaver.save(this.id, {
			cpuPortAmount
		});
	}

	setVideoConnection(conPortNum, value) {
		matrixs[this.id].videoConnections[conPortNum] = value;
		console.log("Setting videoConnection", conPortNum, value);
	}

	setKwmConnection(cpuPortNum, value) {
		matrixs[this.id].kwmConnections[cpuPortNum] = value;
		console.log("Setting kwmConnection", cpuPortNum, value);
	}

	setFullVideoConnections(videoConnections) {
		console.log("setting fullVideoConnections", videoConnections);
	}

	setFullKwmConnections(kwmConnections) {
		console.log("setting fullKwmConnections", kwmConnections);
	}

	setFullConnections(videoConnections, kwmConnections) {
		console.log("settings fullConnections", videoConnections, kwmConnections);
	}
}