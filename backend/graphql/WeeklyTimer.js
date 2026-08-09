import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull,
	GraphQLList
} from "graphql";

import WeeklyTimerVideoConnection from "./WeeklyTimerVideoConnection";
import WeeklyTimerKwmConnection from "./WeeklyTimerKwmConnection";
import WeeklyTimerDefaultState from "./WeeklyTimerDefaultState";
import { valueOf, valuesOf } from "./immutable";

export default new GraphQLObjectType({
	name: "WeeklyTimer",
	fields: () => ({
		id: {
			type: new GraphQLNonNull(GraphQLString),
			resolve: timer => String(valueOf(timer, "id"))
		},
		slug: {
			type: GraphQLString,
			resolve: timer => valueOf(timer, "slug")
		},
		minutes: {
			type: GraphQLInt,
			resolve: timer => valueOf(timer, "minutes")
		},
		hours: {
			type: GraphQLInt,
			resolve: timer => valueOf(timer, "hours")
		},
		active: {
			type: GraphQLBoolean,
			resolve: timer => valueOf(timer, "active")
		},
		monday: {
			type: GraphQLBoolean,
			resolve: timer => valueOf(timer, "monday")
		},
		tuesday: {
			type: GraphQLBoolean,
			resolve: timer => valueOf(timer, "tuesday")
		},
		wednesday: {
			type: GraphQLBoolean,
			resolve: timer => valueOf(timer, "wednesday")
		},
		thursday: {
			type: GraphQLBoolean,
			resolve: timer => valueOf(timer, "thursday")
		},
		friday: {
			type: GraphQLBoolean,
			resolve: timer => valueOf(timer, "friday")
		},
		saturday: {
			type: GraphQLBoolean,
			resolve: timer => valueOf(timer, "saturday")
		},
		sunday: {
			type: GraphQLBoolean,
			resolve: timer => valueOf(timer, "sunday")
		},
		videoConnections: {
			type: new GraphQLList(WeeklyTimerVideoConnection),
			resolve: timer => valuesOf(valueOf(timer, "videoConnections"))
		},
		kwmConnections: {
			type: new GraphQLList(WeeklyTimerKwmConnection),
			resolve: timer => valuesOf(valueOf(timer, "kwmConnections"))
		},
		defaultStates: {
			type: new GraphQLList(WeeklyTimerDefaultState),
			resolve: timer => valuesOf(valueOf(timer, "defaultStates"))
		}
	})
})
