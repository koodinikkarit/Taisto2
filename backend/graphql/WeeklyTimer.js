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

export default new GraphQLObjectType({
	name: "WeeklyTimer",
	fields: () => ({
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
		},
		videoConnections: {
			type: new GraphQLList(WeeklyTimerVideoConnection)
		},
		kwmConnections: {
			type: new GraphQLList(WeeklyTimerKwmConnection)
		},
		defaultStates: {
			type: new GraphQLList(WeeklyTimerDefaultState)
		}
	})
})