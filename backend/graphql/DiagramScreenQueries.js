import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

/**
 * Business objects
 */

import DiagramScreen from "../business/DiagramScreen";

/**
 * Graphql objects
 */

import DiagramScreenGraphqlObject from "./DiagramScreen";

export default {
	diagramScreens: {
		name: "diagramScreens",
		type: new GraphQLList(DiagramScreenGraphqlObject),
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(DiagramScreen.genAll());
		})
	},
	diagramScreenById: {
		name: "diagramScreenById",
		type: DiagramScreenGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(DiagramScreen.gen(args.id));
		})
	},
	diagramScreenBySlug: {
		name: "diagramScreenBySlug",
		type: DiagramScreenGraphqlObject,
		args: {
			slug: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(DiagramScreen.gen(args.slug));
		})
	}
}