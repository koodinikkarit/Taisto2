import {
	GraphQLList,
	GraphQLNonNull,
	GraphQLString
} from "graphql";

import WeeklyTimer from "./WeeklyTimer";

import {
	db
} from "../TaistoService";
import { valuesOf } from "./immutable";

export default {
	weeklyTimers: {
		name: "WeeklyTimers",
		type: new GraphQLList(WeeklyTimer),
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(valuesOf(db.weeklyTimers));
		})
	},
	weeklyTimerById: {
		name: "WeeklyTimerById",
		type: WeeklyTimer,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(db.weeklyTimers.get(parseInt(args.id)));
		})
	},
	weeklyTimerBySlug: {
		name: "WeeklyTimerBySlug",
		type: WeeklyTimer,
		args: {
			slug: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(db.weeklyTimers.find(p => p.get("slug") === args.slug));
		})
	}
}
