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
import { valueOf, valuesOf } from "./immutable";

export default new GraphQLObjectType({
	name: "DiagramScreen",
	fields: () => ({
		id: {
			type: GraphQLString,
			resolve: screen => String(valueOf(screen, "id"))
		},
		slug: {
			type: GraphQLString,
			resolve: screen => valueOf(screen, "slug")
		},
		matrix: {
			type: MatrixGraphqlObject,
			resolve: screen => valueOf(screen, "matrix")
		},
		conPort: {
			type: ConPortGraphqlObject,
			resolve: screen => valueOf(screen, "conPort")
		},
		cpuPorts: {
			type: new GraphQLList(CpuPortGraphqlObject),
			resolve: screen => valuesOf(valueOf(screen, "cpuPorts"))
		}
	})
});
