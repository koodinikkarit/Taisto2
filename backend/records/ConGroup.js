import Immutable from "immutable";

import { db } from "../TaistoService";

export default class extends Immutable.Record({
	id: null,
	slug: "",
	matrixId: null,
	conPortIds: []
}) {
	get matrix() {
		return db.matrixs.get(this.matrixId);
	}

	get conPorts() {
		return this.conPortIds.map(id => db.conPorts.get(id)).filter(Boolean);
	}
}
