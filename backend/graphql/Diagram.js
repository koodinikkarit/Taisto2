import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";


import DiagramScreen from "./DiagramScreen";

export default new GraphQLObjectType({
	name: "Diagram",
	fields: () => ({
		id: {
			type: GraphQLString
		},
		slug: {
			type: GraphQLString
		},
		diagramScreens: {
			type: new GraphQLList(DiagramScreen)
		}
	})
});