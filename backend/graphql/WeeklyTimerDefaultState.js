import {
	GraphQLString,
	GraphQLObjectType
} from "graphql";

import WeeklyTimer from "./WeeklyTimer";
import DefaultState from "./DefaultState";

export default new GraphQLObjectType({
	name: "WeeklyTimerDefaultState",
	fields: () => ({
		id: {
			type: GraphQLString
		},
		weeklyTimer: {
			type: WeeklyTimer
		},
		defaultState: {
			type: DefaultState
		}
	})
});