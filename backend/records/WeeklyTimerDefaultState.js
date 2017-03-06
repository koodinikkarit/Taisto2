import Immutable from "immutable";

import {
    db
} from "../TaistoService";

export default class extends Immutable.Record({
	id: null,
	weeklyTimerId: null,
	defaultStateId: null
}) {
	get weeklyTimer() {
		return db.weeklyTimers.get(this.weeklyTimerId);
	}

	get defaultState() {
		return db.defaultStates.get(this.defaultStateId);
	}

	execute() {
		this.defaultState.execute();
	}
}