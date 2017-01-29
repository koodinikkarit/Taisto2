import DataSaver from "./DataSaver";
import schedule from "node-schedule";
import DefaultState from "./DefaultState";

var weeklyTimers = { };

var nextId = 1;

const weeklyTimerSaver = new DataSaver({
	path: "weeklytimers",
	interval: 1000
});

var weeklyTimers = weeklyTimerSaver.load();
weeklyTimers.then(weeklyTimers => {
	Object.keys(weeklyTimers).forEach(id => {
		if (id > nextId) nextId = parseInt(id)+1;
	});
})

export default class WeeklyTimer {
	static async gen(id) {
		weeklyTimers = await weeklyTimers;
		if (weeklyTimers[i]) return new WeeklyTimer(id);
		else return null;
	}

	static async del(id) {
		weeklyTimers = await weeklyTimers;
	}

	static async new({
		slug, 
		minutes, 
		hours, 
		monday, 
		tuesday, 
		wednesday, 
		thursday, 
		friday, 
		saturday, 
		sunday }) {
		weeklyTimers = await weeklyTimers;
		var id = nextId++;
		weeklyTimers[id] = {
			slug, 
			minutes, 
			hours, 
			monday, 
			tuesday, 
			wednesday, 
			thursday, 
			friday, 
			saturday, 
			sunday,
			videoConnections: {},
			kwmConnections: {},
			defaultStates: [],
			jobs: []
		};

		WeeklyTimer.updateTimers(id);

		return new WeeklyTimer(id);
	}

	static jobAction(id) {
		var weeklyTimer = weeklyTimers[id];		
		if (weeklyTimer) {
			weeklyTimer.defaultStates.forEach(id => {
				DefaultState.gen(id).then(defaultState => {
					if (defaultState) {
						defaultState.execute();
					}
				});			
			});
		}
	}

	static updateTimers(id) {
		var weeklyTimer = weeklyTimers[id];
		if (weeklyTimer) {
			weeklyTimer.jobs = [];
			if (weeklyTimer.monday) weeklyTimer.jobs.push(schedule.scheduleJob(`* ${weeklyTimer.minutes ? weeklyTimer.minutes : "*"} ${weeklyTimer.hours ? weeklyTimer.hours : "*"} * * 1`, () => this.jobAction(id)));
			if (weeklyTimer.tuesday) weeklyTimer.jobs.push(schedule.scheduleJob(`* ${weeklyTimer.minutes ? weeklyTimer.minutes : "*"} ${weeklyTimer.hours ? weeklyTimer.hours : "*"} * * 2`, () => this.jobAction(id)));
			if (weeklyTimer.wednesday) weeklyTimer.jobs.push(schedule.scheduleJob(`* ${weeklyTimer.minutes ? weeklyTimer.minutes : "*"} ${weeklyTimer.hours ? weeklyTimer.hours : "*"} * * 3`, () => this.jobAction(id)));
			if (weeklyTimer.thursday) weeklyTimer.jobs.push(schedule.scheduleJob(`* ${weeklyTimer.minutes ? weeklyTimer.minutes : "*"} ${weeklyTimer.hours ? weeklyTimer.hours : "*"} * * 4`, () => this.jobAction(id)));
			if (weeklyTimer.friday) weeklyTimer.jobs.push(schedule.scheduleJob(`* ${weeklyTimer.minutes ? weeklyTimer.minutes : "*"} ${weeklyTimer.hours ? weeklyTimer.hours : "*"} * * 5`, () => this.jobAction(id)));
			if (weeklyTimer.saturday) weeklyTimer.jobs.push(schedule.scheduleJob(`* ${weeklyTimer.minutes ? weeklyTimer.minutes : "*"} ${weeklyTimer.hours ? weeklyTimer.hours : "*"} * * 6`, () => this.jobAction(id)));
			if (weeklyTimer.sunday) weeklyTimer.jobs.push(schedule.scheduleJob(`* ${weeklyTimer.minutes ? weeklyTimer.minutes : "*"} ${weeklyTimer.hours ? weeklyTimer.hours : "*"} * * 7`, () => this.jobAction(id)));
	

		}
	}

	constructor(id) {
		Object.defineProperty(this, "id", {
			get: () =>  id
		});	
	}

	insertVideoConnection(conPort, value) {

	}

	insertKwmConnection(cpuPort, value) {

	}

	insertDefaultState(defaultState) {
		var weeklyTimer = weeklyTimers[this.id];
		if (weeklyTimer) {
			weeklyTimer.defaultStates.push(defaultState.id);
		}
	}
}