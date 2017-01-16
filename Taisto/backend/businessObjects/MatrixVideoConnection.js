
var nextId = 1;

var matrixVideoConnections = { };



export default class MatrixVideoConnection {
	static async gen(id) {
		return new Promise((resolve, reject) => {
			resolve(new MatrixVideoConnection(matrixVideoConnections[id]));
		});
	}

	static async del(id) {
		return new Promise((resolve, reject) => {
			delete matrixVideoConnections[id];
			resolve(id);
		});
	}

	static async new({matrixId, conPort, cpuPort}) {
		return new Promise((resolve, reject) => {
			var id = nextId++;
			var newTimer = {
				id,
				matrixId,
				conPort,
				cpuPort
			};
			matrixVideoConnections[id] = newTimer;
		});
	}

	constructor(props) {

	}

	get id() {
		return "011"
	}

	get matrix() {
		return { };
	}

	get conPort() {
		return { };
	}

	get cpuPort() {
		return { };
	}

	mutate(mutator) {
		if (!mutatior) throw "Mutator is not defined";
		else {
			mutator(matrixVideoConnections[this._id])
		}
	}
}