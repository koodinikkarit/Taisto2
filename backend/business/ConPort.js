import DataSaver from "./DataSaver";
import Matrix from "./Matrix";

var nextId = 1;

const conPortSaver = new DataSaver({
	path: "./saves/conPort",
	interval: 1000
});

var conPorts = conPortSaver.load();
conPorts.then(conPort => {
	Object.keys(conPorts).forEach(id => {
		if (id > nextId) nextId = parseInt(id)+1;
	});
});

export default class ConPort {
	static async gen(id) {
		conPorts = await conPorts;
		if (conPorts[id]) return new ConPort(id);
		else return null;
	}

	static async del(id) {
		conPorts = await conPorts;
		if (conPorts[id]) {
			delete conPorts[id];
			conPortSaver.remove(id);
			return true;
		} else return false;
	}

	static async new({ slug, matrix, portNum }) {
		conPorts = await conPorts;
		var id = nextId++;
		var newItem = {
			slug,
			matrix: matrix,
			portNum
		};
		conPorts[id] = newItem;
		conPortSaver.save(id, newItem);
		return new ConPort(id);
	}

	constructor(id) {
		Object.defineProperty(this, "id", {
			get: () => id
		});
	}

	get slug() {
		return conPorts[this.id].slug;
	}

	get matrix() {
		return Matrix.gen(conPorts[this.id].matrix);
	}

	get portNum() {
		return conPorts[this.id].portNum;
	}

	set slug(slug) {
		conPorts[this.id].slug = slug;
		conPortSaver.save(this.id, {
			slug
		});
	}	

	setValue() {
		
	}
}