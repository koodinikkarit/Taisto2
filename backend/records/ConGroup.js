import Immutable from "immutable";

import { db } from "../TaistoService";

export default class extends Immutable.Record({
	id: null,
	slug: "",
	matrixId: null,
	conPortIds: [],
	useAllCpuPorts: true,
	cpuPortIds: []
}) {
	get matrix() {
		return db.matrixs.get(this.matrixId);
	}

	get conPorts() {
		return this.conPortIds.map(id => db.conPorts.get(id)).filter(Boolean);
	}

	get cpuPorts() {
		if (this.useAllCpuPorts) {
			return this.matrix ? this.matrix.cpuPorts.valueSeq().toArray() : [];
		}
		return this.cpuPortIds.map(id => db.cpuPorts.get(id)).filter(Boolean);
	}

	allowsCpuPort(id) {
		return this.useAllCpuPorts || this.cpuPortIds.includes(id);
	}
}
