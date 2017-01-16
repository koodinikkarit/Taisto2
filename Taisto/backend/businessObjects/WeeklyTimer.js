
import WeeklyTimersList from "./WeeklyTimersList"
import MatrixVideoConnection from "./MatrixVideoConnection";

var nextId = 1;

var weeklyTimers = {

};

export default class WeeklyTimer {
	static async gen(id) {
		return new Promise((resolve, reject) => {
			resolve(new WeeklyTimer(weeklyTimers[id]));
		});
	}

	static async del(id) {
		return new Promise((resolve, reject) => {
			delete weeklyTimers[id];
			WeeklyTimersList.del(id);
			resolve(id);
		})
	}

	static async new({slug}) {
		return new Promise((resolve, reject) => {
			var id = nextId++;
			var newTimer = {
				id,
				slug
			}
			weeklyTimers[id] = newTimer; 
			resolve(new WeeklyTimer(newTimer));
		});
	}

	constructor(props) {
		this._id = props.id;
		this._slug = props.slug;
		this._active = props.active;
		this._minutes = props.minutes;
		this._hours = props.hours;
		this._monday = props.monday;
		this._tuesday = props.tuesday;
		this._wednesday = props.wednesday;
		this._thursday = props.thursday;
		this._friday = props.friday;
		this._saturday = props.saturday;
		this._sunday = props.sunday;
	}

	get id() {
		return this._id;
	}

	get slug() {
		return this._slug;
	}

	get active() {
		return this._active;
	}

	get minutes() {
		return this._minutes;
	}

	get hours() {
		return this._hours;
	}

	get monday() {
		return this._monday;
	}

	get tuesday() {
		return this._tuesday;
	}

	get wednesday() {
		return this._wednesday;
	}

	get thursday() {
		return this._thursday;
	}

	get friday() {
		return this._friday;
	}

	get saturday() {
		return this._saturday;
	}

	get sunday() {
		return this._sunday;
	}

	addVideoConnection(matrixId, conPort, cpuPort) {
		var timer = weeklyTimers[this._id];
		if (!timer.videoConnections) timer.videoConnections = [];
		timer.videoConnections.push(MatrixVideoConnection.new({matrixId, conPort, cpuPort}).id);

	}

	removeVideoConnection(id) {
		var timer = weeklyTimers[this._id];
		if (timer.videoConnections) {
			timer.videoConnections.some((id2, i) => {
				if (id2 == id) {
					timer.videoConnections.splice(i, 1);
					MatrixVideoConnection.del(id);
					return true;
				}
			});
		}
	}

	mutate(mutator) {
		if (!mutator) throw "Mutator is not defined";
		else {
			mutator(weeklyTimers[this._id]);
		}
	}
}