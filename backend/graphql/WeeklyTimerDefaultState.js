import {
	GraphQLString,
	GraphQLObjectType
} from "graphql";

import WeeklyTimer from "./WeeklyTimer";
import DefaultState from "./DefaultState";
import { valueOf } from "./immutable";

export default new GraphQLObjectType({
	name: "WeeklyTimerDefaultState",
	fields: () => ({
		id: {
			type: GraphQLString,
			resolve: connection => String(valueOf(connection, "id"))
		},
		weeklyTimer: {
			type: WeeklyTimer,
			resolve: connection => valueOf(connection, "weeklyTimer")
		},
		defaultState: {
			type: DefaultState,
			resolve: connection => valueOf(connection, "defaultState")
		}
	})
});
