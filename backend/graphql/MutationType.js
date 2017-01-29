import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull,
	GraphQLInt,
	GraphQLBoolean
} from "graphql";

import MatrixGraphqlObject from "./Matrix";
import ConPortGraphqlObject from "./ConPort";
import CpuPortGraphqlObject from "./CpuPort";
import Matrix from "../business/Matrix";
import ConPort from "../business/ConPort";
import CpuPort from "../business/CpuPort";

import matrixMutations from "./MatrixMutations";
import diagramMutations from "./DiagramMutations";
import diagramScreenMutations from "./DiagramScreenMutations";
import weeklyTimerMutations from "./WeeklyTimerMutations";
import cronTimerMutations from "./CronTimerMutations";

export default new GraphQLObjectType({
	name: "MutationType",
	fields: () => Object.assign(
		matrixMutations,
		diagramMutations,
		diagramScreenMutations,
		weeklyTimerMutations,
		cronTimerMutations
	)
});