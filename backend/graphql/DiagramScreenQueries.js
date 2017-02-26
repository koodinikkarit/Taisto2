import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

import {
	db
} from "../TaistoService";

/**
 * Graphql objects
 */

import DiagramScreenGraphqlObject from "./DiagramScreen";

export default {
	diagramScreens: {
		name: "diagramScreens",
		type: new GraphQLList(DiagramScreenGraphqlObject),
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(db.diagramScreens);
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
			resolve(db.diagramScreens.get(parseInt(args.id)));
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
			resolve(db.diagramScreens.find(p => p.slug === args.slug));
		})
	}
}