import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} from "graphql";

/**
 * Business objects
 */
import Matrix from "../business/Matrix";

/**
 * Graphql objects
 */

import MatrixGraphqlObject from "./Matrix";


/**
 * Queryparts
 */

import matrixQueries from "./MatrixQueries";
import diagramQueries from "./DiagramQueries";
import diagramScreenQueries from "./DiagramScreenQueries";
import defaultStateQueries from "./DefaultStateQueries";

export default new GraphQLObjectType({
	name: "QueryType",
	fields: () => Object.assign(
		matrixQueries,
		diagramQueries,
		diagramScreenQueries,
		defaultStateQueries
	)
});