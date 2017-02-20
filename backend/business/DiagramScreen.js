import DataSaver from "./DataSaver";
import ConPort from "./ConPort";
import Diagram from "./Diagram";
import Matrix from "./Matrix";

var nextId = 1;

const diagramScreenSaver = new DataSaver({
	path: "./saves/diagramscreens",
	interval: 1000
});

var diagramScreens = diagramScreenSaver.load();

diagramScreens.then(diagramScreens => {
	Object.keys(diagramScreens).forEach(id => {
		if (id > nextId) nextId = parseInt(id) + 1;
	});
});

export default class DiagramScreen {
	static async gen(id) {
		diagramScreens = await diagramScreens;
		if (diagramScreens[id]) return new DiagramScreen(id);
		else return null;
	}

	static async del(id) {
		diagramScreens = await diagramScreens;
		if (diagramScreens[id]) {
			delete diagramScreens[id];
			diagramScreenSaver.remove(id);
		} else return false;
	}

	static async new ({slug, diagramId, conPort, cpuPorts}) {
		diagramScreens = await diagramScreens;
		var id = nextId++;
		var newItem = {
			slug,
			conPort,
			cpuPorts
		};
		diagramScreens[id] = newItem;
		var diagram = Diagram.gen(diagramId)
		diagram.then(diagram => {
			diagram.addDiagramScreen(id);
		});
		diagramScreenSaver.save(id, newItem);
		return new DiagramScreen(id);
	}

	constructor(id) {
		Object.defineProperty(this, "id", {
			get: () => id
		});	
	}

	get slug() {
		return diagramScreens[this.id].slug;
	}

	get matrix() {
		return Matrix.gen(diagramScreens[this.id].matrix);
	}

	set slug(slug) {
		diagramScreens[this.id].slug = slug;
		diagramScreenSaver.save(this.id, {
			slug
		});
	}

	set matrix(matrix) {
		var diagramScreen = diagramsScreens[this.id];
		if (diagramScreen) diagramScreen.matrix = matrix;
	}

	set conPort(conPort) {
		diagramScreens[this.id].conPort = conPort;
		diagramScreenSaver.save(this.id, {
			conPort
		});
	}

	get conPort() {
		return ConPort.gen(diagramScreens[this.id].conPort);
	}
}