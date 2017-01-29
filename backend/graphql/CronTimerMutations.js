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

import Crontimer from "../business/CronTimer";

/**
 * Graphql objects
 */

import CronTimerGraphqlObject from "./CronTimer";
import VideoConnectionGraphqlObject from "./VideoConnection";
import KwmConnectionGraphqlObject from "./KwmConnection";

export default {
	createCronTimer: {
		name: "CreateCronTimer",
		type: CronTimerGraphqlObject,
		args: {
			slug: {
				type: new GraphQLNonNull(GraphQLString)
			},
			role: {
				type: GraphQLString
			}
		}
	},
	editCronTimer: {
		name: "EditCronTimer",
		type: CronTimerGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			slug: {
				type: GraphQLString
			},
			role: {
				type: GraphQLString
			},
			active: {
				type: GraphQLBoolean
			}
		}
	},
	addVideoConnectionToCronTimer: {
		name: "AddVideoConnectionToCronTimer",
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
	addKwmConnectionToCronTimer: {
		name: "AddKwmConnectionToCronTimer",
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