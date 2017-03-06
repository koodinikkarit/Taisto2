import {
	GraphQLString,
	GraphQLObjectType
} from "graphql";

import WeeklyTimer from "./WeeklyTimer";
import ConPort from "./ConPort";
import CpuPort from "./CpuPort";

export default new GraphQLObjectType({
	name: "WeeklyTimerVideoConnection",
	fields: () => ({
		id: {
			type: GraphQLString
		},
		weeklyTimer: {
			type: WeeklyTimer
		},
		conPort: {
			type: ConPort
		},
		cpuPort: {
			type: CpuPort
		}
	})
})