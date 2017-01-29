import DataSaver from "./DataSaver";
import schedule from "node-schedule";
import DefaultState from "./DefaultState";

var cronTimers = { };

var nextId = 1;

const cronTimerSaver = new DataSaver({
	path: "crontimer",
	interval: 1000
});

var cronTimers = cronTimerSaver.load();
cronTimers.then(cronTimer => {
	Object.keys(cronTimers).forEach(id => {
		if (id > nextId) nextId = parseInt(id)+1;
	});
})

export default class CronTimer {
	static async gen(id) {
		cronTimers = await cronTimers;
		if (cronTimers[id]) return new CronTimer(id);
		else return null;
	}

	static async genAll() {
		cronTimers = await cronTimers;
	}

	static async del(id) {
		cronTimers = await cronTimers;
	}

	static async new(rule) {
		cronTimers = await cronTimers;
		var id = nextId++;
		cronTimers[id] = {
			rule: rule,
			videoConnections: {},
			kwmConnections: {},
			defaultStates: []
		};
		return new CronTimer(id);
	}

	constructor(id) {
		Object.defineProperty(this, "id", {
			get: () =>  id
		});
		var cronTimer = cronTimers[this.id];
		if (cronTimer) {
			this.rule = cronTimer.rule;
		}
	}

	jobAction() {
		console.log("jobAction");
		var cronTimer = cronTimers[this.id];
		if (cronTimer) {
			cronTimer.defaultStates.forEach(id => {
				DefaultState.gen(id).then(defaultState => {
					if (defaultState) {
						defaultState.execute();
					}
				});
			});
		}
	}

	insertVideoConnection(conPort, value) {
		console.log("inserting");
		var cronTimer = cronTimers[this.id];
		if (cronTimer) {

		}
	}

	insertKwmConnection(cpuPort, value) {
		var cronTimer = cronTimers[this.id];
		if (cronTimer) {
			
		}
	}

	insertDefaultState(defaultState) {
		var cronTimer = cronTimers[this.id];
		if (cronTimer) {
			cronTimer.defaultStates.push(defaultState.id);
		}
	}

	get rule() {

	}

	set rule(rule) {
		var cronTimer = cronTimers[this.id];
		if (cronTimer) {
			cronTimer.job = schedule.scheduleJob(rule ? rule : cronTimer.rule, () => this.jobAction());
		}
	}
}




	// static async new({
	// 	secondsStart, 
	// 	secondsEnd, 
	// 	minutesStart, 
	// 	minutesEnd, 
	// 	hourStart, 
	// 	hourEnd, 
	// 	dayStart, 
	// 	dayEnd, 
	// 	monthStart,
	// 	monthEnd,
	// 	startDayOfWeek,
	// 	endDayOfWeek,
	// 	rule
	// }) {

	// }