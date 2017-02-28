import {
	GraphQLObjectType,
	GraphQLString,
	GraphQLList
} from "graphql";

import Matrix from "./Matrix";
import DefaultStateVideoConnection from "./DefaultStateVideoConnection";
import DefaultStateKwmConnection from "./DefualtStateKwmConnection";


export default new GraphQLObjectType({
	name: "DefaultState",
	fields: () => ({
		id: {
			type: GraphQLString
		},
		slug: {
			type: GraphQLString
		},
		matrix: {
			type: Matrix
		},
		videoConnections: {
			type: new GraphQLList(DefaultStateVideoConnection)
		},
		kwmConnections: {
			type: new GraphQLList(DefaultStateKwmConnection)
		}
	})
});