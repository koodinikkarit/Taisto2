import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull,
	GraphQLInt,
	GraphQLBoolean
} from "graphql";

import matrixMutations from "./MatrixMutations";
import diagramMutations from "./DiagramMutations";
import diagramScreenMutations from "./DiagramScreenMutations";
import weeklyTimerMutations from "./WeeklyTimerMutations";
import cronTimerMutations from "./CronTimerMutations";
import defaultStateMutations from "./DefaultStateMutations";

export default new GraphQLObjectType({
	name: "MutationType",
	fields: () => Object.assign(
		matrixMutations,
		diagramMutations,
		diagramScreenMutations,
		weeklyTimerMutations,
		cronTimerMutations,
		defaultStateMutations
	)
});