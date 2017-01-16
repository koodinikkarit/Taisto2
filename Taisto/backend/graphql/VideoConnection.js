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

export default new GraphQLObjectType({
	name: "VideoConnection",
	fields: () => ({
		id: {
			type: GraphQLString
		},
		matrix: {
			type: MatrixGraphqlObjectType
		},
		conPort: {
			type: ConPortGraphqlObjectType
		},
		cpuPort: {
			type: CpuPortGraphqlObjectType
		}
	})
});