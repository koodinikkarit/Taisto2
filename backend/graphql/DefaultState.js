import {
	GraphQLObjectType,
	GraphQLString
} from "graphql";

export default new GraphQLObjectType({
	name: "DefaultState",
	fields: () => ({
		id: {
			type: GraphQLString
		},
		slug: {
			type: GraphQLString
		},
	})
});