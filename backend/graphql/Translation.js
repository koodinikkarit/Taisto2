import {
	GraphQLObjectType,
	GraphQLString
} from "graphql";

export default new GraphQLObjectType({
	name: "Translation",
	fields: () => ({
		id: {
			type: GraphQLString
		},
		slug: {
			type: GraphQLString
		},
	})
});