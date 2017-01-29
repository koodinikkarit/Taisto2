import DataSaver from "./DataSaver";
import ConPort from "./ConPort";
import CpuPort from "./CpuPort";

var nextId = 1;

const diagramSaver = new DataSaver({
	path: "diagrams",
	interval: 1000
});

var diagrams = diagramSaver.load();

diagrams.then(diagram => {
	Object.keys(diagrams).forEach(id => {
		if (id > nextId) nextId = parseInt(id) + 1;
	});
});

export default class Diagram {
	static async gen(id) {
		diagrams = await diagrams;
		if (diagrams[id]) return new Diagram(id);
		else return null;
	}

	static async genBySlug(slug) {
		diagrams = await diagrams;
	}

	static async genAll() {
		diagrams = await diagrams;
		
		var d = [];
		Object.keys(diagrams).forEach(id => {
			d.push(Diagram.gen(id));
		});
		return d;
	}

	static async del(id) {
		diagrams = await diagrams;
		if (diagrams[id]) {
			delete diagrams[id];
			diagramSaver.remove(id);
		} else return false;
	}
	
	static async new({slug, diagramScreens}) {
		diagrams = await diagrams;
		var id = nextId++;
		var newItem = {
			slug,
			diagramScreens
		};
		diagrams[id] = newItem;
		diagramSaver.save(id, newItem);
		return new Diagram(id);
	}

	constructor(id) {
		Object.defineProperty(this, "id", {
			get: () => id
		});		
	}

	get slug() {
		return diagrams[this.id].slug;
	}

	set slug(slug) {
		var diagram = diagrams[this.id];
		if (diagram) {
			diagrams[this.id].slug = slug;
			diagramSaver.save(this.id, {
				slug
			});
		}
	}
}