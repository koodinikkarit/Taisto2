import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

import {
	db,
	setDb,
	createWeeklyTimer,
	addDefaultStateToWeeklyTimer,
	addKwmConnectionToWeeklyTimer,
	addVideoConnectionToWeeklyTimer
} from "../TaistoService";

/**
 * Graphql objects
 */

import WeeklyTimerGraphqlObject from "./WeeklyTimer";

import WeeklyTimerVideoConnection from "./WeeklyTimerVideoConnection";
import WeeklyTimerKwmConnection from "./WeeklyTimerKwmConnection";
import WeeklyTimerDefaultSTate from "./WeeklyTimerDefaultState";

export default {
	createWeeklyTimer: {
		name: "CreateWeeklyTimer",
		type: WeeklyTimerGraphqlObject,
		args: {
			slug: {
				type: GraphQLString
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(createWeeklyTimer(args.slug));
		})
	},
	removeWeeklyTimer: {
		name: "RemoveWeeklyTimer",
		type: GraphQLBoolean,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var weeklyTimer = db.weeklyTimers.get(parseInt(args.id));
			if (weeklyTimer) {
				setDb(db.withMutations(db => {
					db.weeklyTimers = db.weeklyTimers.delete(weeklyTimer.id);
					db.weeklyTimerVideoConnections = db.weeklyTimerVideoConnections.filterNot(p => p.weeklyTimerId === weeklyTimer.id);
					db.weeklyTimerKwmConnections = db.weeklyTimerKwmConnections.filterNot(p => p.weeklyTimerId === weeklyTimer.id);
					db.weeklyTimerDefaultStates = db.weeklyTimerDefaultStates.filterNot(p => p.weeklyTimerId === weeklyTimer.id);
				}));
				resolve(true);
			}
			resolve(false);
		})
	},
	editWeeklyTimer: {
		name: "EditWeeklyTimer",
		type: WeeklyTimerGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			slug: {
				type: GraphQLString
			},
			minutes: {
				type: GraphQLInt
			},
			hours: {
				type: GraphQLInt
			},
			active: {
				type: GraphQLBoolean
			},
			monday: {
				type: GraphQLBoolean
			},
			tuesday: {
				type: GraphQLBoolean
			},
			wednesday: {
				type: GraphQLBoolean
			},
			thursday: {
				type: GraphQLBoolean
			},
			friday: {
				type: GraphQLBoolean
			},
			saturday: {
				type: GraphQLBoolean
			},
			sunday: {
				type: GraphQLBoolean
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var weeklyTimer = db.weeklyTimers.get(parseInt(args.id));
			if (weeklyTimer) {
				setDb(db.withMutations(db => {
					weeklyTimer = weeklyTimer.withMutations(weeklyTimer => {
						if (args.slug != null) weeklyTimer.slug = args.slug;
						if (args.minutes != null) weeklyTimer.minutes = args.minutes;
						if (args.hours != null) weeklyTimer.hours = args.hours;
						if (args.active != null) weeklyTimer.active = args.active;
						if (args.monday != null) weeklyTimer.monday = args.monday;
						if (args.tuesday != null) weeklyTimer.tuesday = args.tuesday;
						if (args.wednesday != null) weeklyTimer.wednesday = args.wednesday;
						if (args.thursday != null) weeklyTimer.thursday = args.thursday;
						if (args.friday != null) weeklyTimer.friday = args.friday;
						if (args.saturday != null) weeklyTimer.saturday = args.saturday;
						if (args.sunday != null) weeklyTimer.sunday = args.sunday;
					})
					db.weeklyTimers = db.weeklyTimers.set(weeklyTimer.id, weeklyTimer);
				}));
				resolve(weeklyTimer);
			}
			reject({
				virhe: "makkara"
			});
		})
	},
	addVideoConnectionToWeeklyTimer: {
		name: "AddVideoConnectionToWeeklyTimer",
		type: WeeklyTimerVideoConnection,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			conPort: {
				type: new GraphQLNonNull(GraphQLString)
			},
			cpuPort: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(addVideoConnectionToWeeklyTimer(parseInt(args.id), parseInt(args.conPort), parseInt(args.cpuPort)));
		})
	},
	removeVideoConnectionFromWeeklyTimer: {
		name: "RemoveVideoConnectionFromWeeklyTimer",
		type: GraphQLBoolean,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			conPort: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var weeklyTimerVideoConnection = db.weeklyTimerVideoConnections.find(p => p.weeklyTimerId === parseInt(args.id) && p.conPortId === parseInt(args.conPort));
			if (weeklyTimerVideoConnection) {
				setDb(db.withMutations(db => {
					db.weeklyTimerVideoConnections = db.weeklyTimerVideoConnections.delete(weeklyTimerVideoConnection.id)
				}));
				resolve(true);
			}
			resolve(false);
		})
	},
	addKwmConnectionToWeeklyTimer: {
		name: "AddKwmConnectionToWeeklyTimer",
		type: WeeklyTimerKwmConnection,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			conPort: {
				type: new GraphQLNonNull(GraphQLString)
			},
			cpuPort: {
				type: new GraphQLNonNull(GraphQLString)
			}			
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(addKwmConnectionToWeeklyTimer(parseInt(args.id), parseInt(args.conPort), parseInt(args.cpuPort)));
		})
	},
	removeKwmConnectionFromWeeklyTimer: {
		name: "RemoveKwmConnectionsFromWeeklyTimer",
		type: GraphQLBoolean,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			cpuPort: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var weeklyTimerKwmConnection = db.weeklyTimerKwmConnections.find(p => p.weeklyTimerId === parseInt(args.id) && p.cpuPortId === parseInt(args.cpuPort));
			if (weeklyTimerKwmConnection) {
				setDb(db.withMutations(db => {
					db.weeklyTimerKwmConnections = db.weeklyTimerKwmConnections.delete(weeklyTimerKwmConnection.id);
				}));
				resolve(true);
			}
			resolve(false);
		})
	},
	addDefaultStateToWeeklyTimer: {
		name: "AddDefaultStateToWeeklyTimer",
		type: WeeklyTimerDefaultSTate,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			defaultState: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(addDefaultStateToWeeklyTimer(parseInt(args.id), parseInt(args.defaultState)));
		})
	},
	removeDefaultStateFromWeeklyTimer: {
		name: "RemoveDefaultStateToWeeklyTimer",
		type: GraphQLBoolean,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			defaultState: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var weeklyTimerDefaultState = db.weeklyTimerDefaultStates.find(p => p.weeklyTimerId === parseInt(args.id) && p.defaultStateId === parseInt(args.defaultState));
			if (weeklyTimerDefaultState) {
				setDb(db.withMutations(db => {
					db.weeklyTimerDefaultStates = db.weeklyTimerDefaultStates.delete(weeklyTimerDefaultState.id);
				}));
				resolve(true);
			}
			resolve(false);
		})
	}
}