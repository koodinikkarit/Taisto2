import {
	GraphQLObjectType,
	GraphQLString,
	GraphQLList
} from "graphql";

import Matrix from "./Matrix";
import DefaultStateVideoConnection from "./DefaultStateVideoConnection";
import DefaultStateKwmConnection from "./DefualtStateKwmConnection";
import { valueOf, valuesOf } from "./immutable";


export default new GraphQLObjectType({
	name: "DefaultState",
	fields: () => ({
		id: {
			type: GraphQLString,
			resolve: state => String(valueOf(state, "id"))
		},
		slug: {
			type: GraphQLString,
			resolve: state => valueOf(state, "slug")
		},
		matrix: {
			type: Matrix,
			resolve: state => valueOf(state, "matrix")
		},
		videoConnections: {
			type: new GraphQLList(DefaultStateVideoConnection),
			resolve: state => valuesOf(valueOf(state, "videoConnections"))
		},
		kwmConnections: {
			type: new GraphQLList(DefaultStateKwmConnection),
			resolve: state => valuesOf(valueOf(state, "kwmConnections"))
		}
	})
});
