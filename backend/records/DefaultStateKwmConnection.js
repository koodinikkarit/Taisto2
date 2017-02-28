import Immutable from "immutable";

import {
	db
} from "../TaistoService";

export default class extends Immutable.Record({
	id: null,
	conPortId: null,
	cpuPortId: null,
	defaultStateId: null
}) {
	get conPort() {
		return db.conPorts.get(this.conPortId);
	}

	get cpuPort() {
		return db.cpuPorts.get(this.cpuPortId);
	}
}