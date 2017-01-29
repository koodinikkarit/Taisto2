import DataSaver from "./DataSaver";
import Matrix from "./Matrix";

var nextId = 1;

const defaultStateSaver = new DataSaver({
	path: "DefaultState",
	interval: 1000
});

var defaultStates = defaultStateSaver.load();
defaultStates.then(defaultStates => {
	Object.keys(defaultStates).forEach(id => {
		if (id > nextId) nextId = parseInt(id)+1;
	});
});

export default class DefaultState {
	static async gen(id) {
		defaultStates = await defaultStates;
		if (defaultStates[id]) return new DefaultState(id);
		else return null;
	}

	static async del(id) {
		defaultStates = await defaultStates;
	}

	static async new({ matrix, videoConnections, kwmConnections }) {
		defaultStates = await defaultStates;
		var id = nextId++;
		defaultStates[id] = {
			matrix,
			videoConnections,
			kwmConnections
		};
		return new DefaultState(id);
	}
	constructor(id) {
		Object.defineProperty(this, "id", {
			get: () => id
		});
	}

	execute() {
		var defaultState = defaultStates[this.id];
		if (defaultState) {
			Matrix.gen(defaultState.matrix).then(matrix => {
				if (defaultState.videoConnections &&
					Object.keys(defaultState.videoConnections).length > 0 &&
					defaultState.kwmConnections &&
				    Object.keys(defaultState.kwmConnections).length > 0) {
					matrix.setFullConnections(defaultState.videoConnections, defaultState.kwmConnections);
				} else if (defaultState.videoConnections &&
						   Object.keys(defaultState.videoConnections).length > 0) {
					matrix.setFullVideoConnections(defaultState.videoConnections);
				} else if (defaultState.kwmConnections &&
						   Object.keys(defaultState.kwmConnections).length > 0) {
					matrix.setFullKwmConnections(defaultState.kwmConnections);
				}
			});
		}
	}
}