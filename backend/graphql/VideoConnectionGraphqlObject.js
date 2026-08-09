import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

import MatrixGraphqlObjectType from "./Matrix"
import ConPortGraphqlObjectType from "./ConPort";
import CpuPortGraphqlObjectType from "./CpuPort";
import { valueOf } from "./immutable";

export default new GraphQLObjectType({
	name: "VideoConnection",
	fields: () => ({
		id: {
			type: GraphQLString,
			resolve: connection => String(valueOf(connection, "id"))
		},
		matrix: {
			type: MatrixGraphqlObjectType,
			resolve: connection => valueOf(connection, "matrix")
		},
		conPort: {
			type: ConPortGraphqlObjectType,
			resolve: connection => valueOf(connection, "conPort")
		},
		cpuPort: {
			type: CpuPortGraphqlObjectType,
			resolve: connection => valueOf(connection, "cpuPort")
		}
	})
});
