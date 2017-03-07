import Immutable from "immutable";
import schedule from "node-schedule";

import {
    db
} from "../TaistoService";

var scheduleJobs = {}

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
	constructor(props) {
		super(props);
		var rule = new schedule.RecurrenceRule();
		rule.dayOfWeek = [0, new schedule.Range(4, 6)];
		if (props.monday) rule.dayOfWeek.push(1);
		if (props.tuesday) rule.dayOfWeek.push(2);
		if (props.wednesday) rule.dayOfWeek.push(3);
		if (props.thursday) rule.dayOfWeek.push(4);
		if (props.friday) rule.dayOfWeek.push(5);
		if (props.saturday)  rule.dayOfWeek.push(6);
		if (props.sunday) rule.dayOfWeek.push(0);
		rule.hour = props.gours;
		rule.minute = props.minutes;
		scheduleJobs[props.id] = {
			rule
		};
		if (props.active) {
			scheduleJobs[props.id].job = schedule.scheduleJob(rule, () => {
  				executeWeeklyTimer(props.id);
			});
		}
	}
	
	set (key, value) {
		super.set(key, value);
		var scheduleJob = scheduleJobs[this.id];
		if (scheduleJob) {
			var restartJob = false;
			switch (key) {
				case "monday":
					checkScheduleJobWeekday(scheduleJob, 1, value, this.id);
					break;
				case "tuesday":
					checkScheduleJobWeekday(scheduleJob, 2, value, this.id);
					break;
				case "wednesday":
					checkScheduleJobWeekday(scheduleJob, 3, value, this.id);
					break;
				case "thursday":
					checkScheduleJobWeekday(scheduleJob, 4, value, this.id);
					break;
				case "friday":
					checkScheduleJobWeekday(scheduleJob, 5, value, this.id);
					break;
				case "saturday":
					checkScheduleJobWeekday(scheduleJob, 6, value, this.id);
					break;
				case "sunday":
					checkScheduleJobWeekday(scheduleJob, 0, value, this.id);
					break;
				case "minutes":
					if (scheduleJob.rule.minute !== value) {
						scheduleJob.rule.minute = value;
						if (scheduleJob.rule) scheduleJob.job.cancel();
						scheduleJob.job = schedule.scheduleJob(scheduleJob.rule, () => {
  							executeWeeklyTimer(this.id);
						});
					}
					break;
				case "hours":
					if (scheduleJob.rule.hour !== value) {
						scheduleJob.rule.hour = value;
						if (scheduleJob.rule) scheduleJob.job.cancel();
						scheduleJob.job = schedule.scheduleJob(scheduleJob.rule, () => {
  							executeWeeklyTimer(this.id);
						});
					}
					break;
				case "active":
					if (value === true) {
						scheduleJob = schedule.scheduleJob(scheduleJob.rule, () => {
  							executeWeeklyTimer(this.id);
						});
					} else if (value === false) {
						if (scheduleJob.job) {
							scheduleJob.job.cancel();
							delete scheduleJob.job;
						}
					}
					break;
				default:
					break;
			}
		}
	}

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

function checkScheduleJobWeekday(scheduleJob, dayNumber, value, weeklyTimerId) {
	if (value === true) {
		if (!scheduleJob.rule.dayOfWeek.some(p => p === dayNumber)) {
			scheduleJob.rule.dayOfWeek.push(dayNumber);
			if (scheduleJob.job) scheduleJob.job.cancel();
			scheduleJob.job = schedule.scheduleJob(scheduleJob.rule, () => {
				executeWeeklyTimer(weeklyTimerId);
			});
		}
	} if (value === false) {
		scheduleJob.rule.dayOfWeek = scheduleJob.rule.dayOfWeek.filter(p => p !== 1);
		if (scheduleJob.job) scheduleJob.job.cancel();
		scheduleJob.job = schedule.scheduleJob(scheduleJob.rule, () => {
  			executeWeeklyTimer(weeklyTimerId);
		});
	}
}

function executeWeeklyTimer(id) {
	if (id) {
		db.weeklyTimerVideoConnections.filter(p => p.weeklyTimerId === id).forEach(weeklyTimerVideoConnection => {
			weeklyTimerVideoConnection.execute();
		});
		db.weeklyTimerKwmConnections.filter(p => p.weeklyTimerId === id).forEach(weeklyTimerKwmConnection => {
			weeklyTimerKwmConnection.execute();
		});
		db.weeklyTimerDefaultStates.filter(p => p.weeklyTimerId === id).forEach(p => p.execute());
	}
}