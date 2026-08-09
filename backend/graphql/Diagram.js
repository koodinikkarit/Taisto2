import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";


import DiagramScreen from "./DiagramScreen";
import { valueOf, valuesOf } from "./immutable";

export default new GraphQLObjectType({
	name: "Diagram",
	fields: () => ({
		id: {
			type: GraphQLString,
			resolve: diagram => String(valueOf(diagram, "id"))
		},
		slug: {
			type: GraphQLString,
			resolve: diagram => valueOf(diagram, "slug")
		},
		diagramScreens: {
			type: new GraphQLList(DiagramScreen),
			resolve: diagram => valuesOf(valueOf(diagram, "diagramScreens"))
		}
	})
});
