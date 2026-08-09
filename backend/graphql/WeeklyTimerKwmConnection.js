import {
	GraphQLString,
	GraphQLObjectType
} from "graphql";

import WeeklyTimer from "./WeeklyTimer";
import ConPort from "./ConPort";
import CpuPort from "./CpuPort";
import { valueOf } from "./immutable";

export default new GraphQLObjectType({
	name: "WeeklyTimerKwmConnection",
	fields: () => ({
		id: {
			type: GraphQLString,
			resolve: connection => String(valueOf(connection, "id"))
		},
		weeklyTimer: {
			type: WeeklyTimer,
			resolve: connection => valueOf(connection, "weeklyTimer")
		},
		conPort: {
			type: ConPort,
			resolve: connection => valueOf(connection, "conPort")
		},
		cpuPort: {
			type: CpuPort,
			resolve: connection => valueOf(connection, "cpuPort")
		}
	})
})
