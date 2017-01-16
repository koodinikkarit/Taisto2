import WeeklyTimer from "./WeeklyTimer";

var weeklyTimers = [];

export default class {
	static async gen() {
		return weeklyTimers.map(p => {
			return WeeklyTimer.gen(p);
		});
	}

	static async del(id) {
		weeklyTimers.find((p, i) => {
			 if (p == id) {
				 weeklyTimers.splice(i, 1);
			 }			 
		});
	}

	static async insertWeeklyTimer(id) {
		weeklyTimers.push(id);
	}
}