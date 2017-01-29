import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

import ConPortGraphqlObject from "./ConPort";
import CpuPortGraphqlObject from "./CpuPort";

export default new GraphQLObjectType({
	name: "DiagramScreens",
	fields: () => ({
		id: {
			type: GraphQLString
		},
		slug: {
			type: GraphQLString
		},
		conPort: {
			type: ConPortGraphqlObject
		},
		cpoPorts: {
			type: new GraphQLList(CpuPortGraphqlObject)
		}
	})
});