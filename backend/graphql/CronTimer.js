import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

export default new GraphQLObjectType({
	name: "CronTimer",
	fields: () => ({
		id: {
			type: new GraphQLNonNull(GraphQLString)
		},
		slug: {
			type: GraphQLString
		},
		startSeconds: {
			type: GraphQLInt
		},
		endSeconds: {
			type: GraphQLInt
		},
		startMinutes: {
			type: GraphQLInt
		},
		endMinutes: {
			type: GraphQLInt
		},
		startHours: {
			type: GraphQLInt
		},
		startDayOfMonth: {
			type: GraphQLInt
		},
		endDayOfMonth: {
			type: GraphQLInt
		},
		startMonth: {
			type: GraphQLInt
		},
		endMonth: {
			type: GraphQLInt
		},
		startDayOfWeek: {
			type: GraphQLInt
		},
		endDayOfWeek: {
			type: GraphQLInt
		}
	})
});