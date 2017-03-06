import Immutable from "immutable";

import {
    db
} from "../TaistoService";

export default class extends Immutable.Record({
	id: null,
	weeklyTimerId: null,
	conPortId: null,
	cpuPortId: null
}) {
	get weeklyTimer() {
		return db.weeklyTimers.get(this.weeklyTimerId);
	}

	get conPort() {
		return db.conPorts.get(this.conPortId);
	}

	get cpuPort() {
		return db.cpuPorts.get(this.cpuPortId);
	}

	execute() {
		this.cpuPort.setValue(conPort.portNum);
	}
}