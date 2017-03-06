import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} from "graphql";

/**
 * Queryparts
 */

import matrixQueries from "./MatrixQueries";
import diagramQueries from "./DiagramQueries";
import diagramScreenQueries from "./DiagramScreenQueries";
import defaultStateQueries from "./DefaultStateQueries";
import weeklyTimerQueries from "./WeeklyTimerQueries";

export default new GraphQLObjectType({
	name: "QueryType",
	fields: () => Object.assign(
		matrixQueries,
		diagramQueries,
		diagramScreenQueries,
		defaultStateQueries,
		weeklyTimerQueries
	)
});