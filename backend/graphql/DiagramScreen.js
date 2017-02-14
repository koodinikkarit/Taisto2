import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

import MatrixGraphqlObject from "./Matrix";
import ConPortGraphqlObject from "./ConPort";
import CpuPortGraphqlObject from "./CpuPort";

export default new GraphQLObjectType({
	name: "DiagramScreen",
	fields: () => ({
		id: {
			type: GraphQLString
		},
		slug: {
			type: GraphQLString
		},
		matrix: {
			type: MatrixGraphqlObject
		},
		conPort: {
			type: ConPortGraphqlObject
		},
		cpuPorts: {
			type: new GraphQLList(CpuPortGraphqlObject)
		}
	})
});