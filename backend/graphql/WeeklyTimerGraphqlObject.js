import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

export default new GraphQLObjectType({
	name: "WeeklyTimer",
	fields: () => ({
		id: {
			type: new GraphQLNonNull(GraphQLString)
		},
		slug: {
			type: GraphQLString
		},
		minutes: {
			type: GraphQLInt
		},
		hours: {
			type: GraphQLInt
		},
		active: {
			type: GraphQLBoolean
		},
		monday: {
			type: GraphQLBoolean
		},
		tuesday: {
			type: GraphQLBoolean
		},
		wednesday: {
			type: GraphQLBoolean
		},
		thursday: {
			type: GraphQLBoolean
		},
		friday: {
			type: GraphQLBoolean
		},
		saturday: {
			type: GraphQLBoolean
		},
		sunday: {
			type: GraphQLBoolean
		}
	})
})