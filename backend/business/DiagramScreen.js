import DataSaver from "./DataSaver";
import ConPort from "./ConPort";

var nextId = 1;

const diagramScreenSaver = new DataSaver({
	path: "diagramscreens",
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
			diagramSaver.remove(id);
		} else return false;
	}

	static async new ({slug, conPort, cpuPorts}) {
		diagramScreens = await diagramScreens;
		var id = nextId++;
		console.log("conPort", conPort);
		var newItem = {
			slug,
			conPort,
			cpuPorts
		};
		diagramScreens[id] = newItem;
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

	set slug(slug) {
		diagramScreens[this.id].slug = slug;
		diagramScreenSaver.save(this.id, {
			slug
		});
	}

	set conPort(conPort) {
		diagramScreens[this.id].conPort = conPort;
		diagramScreenSaver.save(this.id, {
			conPort
		});
	}

	get conPort() {
		console.log("diagrams", diagramScreens[this.id].conPort);
		return ConPort.gen(diagramScreens[this.id].conPort);
	}
}