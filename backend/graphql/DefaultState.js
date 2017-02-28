import {
	GraphQLObjectType,
	GraphQLString,
	GraphQLList
} from "graphql";

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
		videoConnections: {
			type: new GraphQLList(DefaultStateVideoConnection)
		},
		kwmConnections: {
			type: new GraphQLList(DefaultStateKwmConnection)
		}
	})
});