import Immutable from "immutable";

import {
    db
} from "../TaistoService";

export default class extends Immutable.Record({
	id: null,
    slug: "",
	minutes: 0,
	hours: 0,
	active: false,
	monday: false,
	tuesday: false,
	wednesday: false,
	thursday: false,
	friday: false,
	saturday: false,
	sunday: false
}) {
	get videoConnections() {
		return db.weeklyTimerVideoConnections.filter(p => p.weeklyTimerId === this.id);
	}

	get kwmConnections() {
		return db.weeklyTimerKwmConnections.filter(p => p.weeklyTimerId === this.id);
	}

	get defaultStates() {
		return db.weeklyTimerDefaultStates.filter(p => p.weeklyTimerId === this.id);
	}
}