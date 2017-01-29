var matrixVideoConnections = { };

var nextId = 0;

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
}