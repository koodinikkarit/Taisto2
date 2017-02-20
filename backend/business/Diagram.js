import DataSaver from "./DataSaver";
import ConPort from "./ConPort";
import CpuPort from "./CpuPort";
import DiagramScreen from "./DiagramScreen";

var nextId = 1;

const diagramSaver = new DataSaver({
	path: "./saves/diagrams",
	interval: 1000
});

var diagrams = diagramSaver.load();
var slugToIds = {};

diagrams.then(diagrams => {
	Object.keys(diagrams).forEach(id => {
		var diagram = diagrams[id];
		if (diagram) {
			
			slugToIds[diagram.slug] = id;
		}
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
		var id = slugToIds[slug];
		if (id ) {
			if (diagrams[id]) return new Diagram(id);
		}
		return null;
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
			diagrams[id].diagramScreens.forEach(id => {
				DiagramScreen.del(id);
			});
			delete diagrams[id];
			diagramSaver.remove(id);

		} else return false;
	}
	
	static async new({slug, diagramScreens}) {
		diagrams = await diagrams;
		var id = nextId++;
		var newItem = {
			slug: slug ? slug : "",
			diagramScreens: diagramScreens ? diagramScreens : []
		};
		slugToIds[slug] = id;
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

	get diagramScreens() {
		var screens = diagrams[this.id].diagramScreens;
		var diagramScreens = [];
		if (screens) {
			screens.forEach(id => {
				diagramScreens.push(DiagramScreen.gen(id));
			});
		}
		return diagramScreens;
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

	addDiagramScreen(id) {
		var diagram = diagrams[this.id];
		diagram.diagramScreens.push(id);
		diagramSaver.save(this.id, {
			diagramsScreens: [...diagram.diagramScreens, id]
		});
	}
}