import DataSaver from "./DataSaver";
import Matrix from "./Matrix";

var nextId = 1;

const cpuPortSaver = new DataSaver({
	path: "cpuPort",
	interval: 1000
});

var cpuPorts = cpuPortSaver.load();
cpuPorts.then(cpuPort => {
	Object.keys(cpuPorts).forEach(id => {
		if (id > nextId) nextId = parseInt(id)+1;
	});
});

export default class CpuPort {
	static async gen(id) {
		cpuPorts = await cpuPorts;
		if (cpuPorts[id]) return new CpuPort(id);
		else return null;
	}

	static async del(id) {
		cpuPorts = await cpuPorts;
		if (cpuPorts[id]) {
			delete cpuPorts[id];
			cpuPortSaver.remove(id);
			return true;
		} else return false;		
	}

	static async new({ slug, matrix, portNum }) {
		cpuPorts = await cpuPorts;
		var id = nextId++;
		var newItem = {
			slug,
			matrix: matrix,
			portNum
		};
		cpuPorts[id] = newItem;
		cpuPortSaver.save(id, newItem);
		return new CpuPort(id);
	}

	constructor(id) {
		Object.defineProperty(this, "id", {
			get: () => id
		});
	}

	get slug() {
		return cpuPorts[this.id].slug;
	}

	get matrix() {
		return Matrix.gen(cpuPorts[this.id].matrix);
	}

	get portNum() {
		return cpuPorts[this.id].portNum;
	}

	set slug(slug) {
		cpuPorts[this.id].slug = slug;
		cpuPortSaver.save(this.id, {
			slug
		});
	}

	setValue(value) {

	}
}
