import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

/**
 * Business objects
 */

import WeeklyTimer from "../business/WeeklyTimer";

/**
 * Graphql objects
 */

import WeeklyTimerGraphqlObject from "./WeeklyTimer";
import VideoConnectionGraphqlObject from "./VideoConnection";
import KwmConnectionGraphqlObject from "./KwmConnection";

export default {
	createWeeklyTimer: {
		name: "CreateWeeklyTimer",
		type: WeeklyTimerGraphqlObject,
		args: {
			slug: {
				type: GraphQLString
			}
		}
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
		}
	},
	addVideoConnectionToWeeklyTimer: {
		name: "AddVideoConnectionToWeeklyTimer",
		type: VideoConnectionGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			conPort: {
				type: new GraphQLNonNull(GraphQLString)
			},
			cpuPort: {
				type: new GraphQLNonNull(GraphQLString)
			},
			matrix: {
				type: new GraphQLNonNull(GraphQLString)
			}
		}
	},
	addKwmConnectionToWeeklyTimer: {
		name: "AddKwmConnectionToWeeklyTimer",
		type: KwmConnectionGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			conPort: {
				type: new GraphQLNonNull(GraphQLString)
			},
			cpuPort: {
				type: new GraphQLNonNull(GraphQLString)
			},
			matrix: {
				type: new GraphQLNonNull(GraphQLString)
			}			
		}
	}
}