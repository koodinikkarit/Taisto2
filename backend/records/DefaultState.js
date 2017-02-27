import Immutable from "immutable";

import {
	db
} from "../TaistoService";

export default class extends Immutable.Record({
	id: null,
	slug: "",
	matrixId: null
}) {
	get matrix() {
		return db.matrix.get(this.matrixId);
	}

	get videoConnections() {
		return db.defaultStateVideoConnections.filter(p => p.defaultStateId === this.id);
	}

	get kwmConnections() {
		return db.defaultStateKwmConnections.filter(p => p.defaultStateId === this.id);
	}
}