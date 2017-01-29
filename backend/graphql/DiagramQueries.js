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

import Diagram from "../business/Diagram";

/**
 * Graphql objects
 */

import DiagramGraphqlObject from "./Diagram";


export default {
	diagrams: {
		name: "diagrams",
		description: "Hakee kaikki kaaviot",
		type: new GraphQLList(DiagramGraphqlObject),
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(Diagram.genAll());
		})
	},
	diagramById: {
		name: "DiagramById",
		type: DiagramGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(Diagram.gen(args.id));
		})
	},
	diagramBySlug: {
		name: "DiagramBySlug",
		type: DiagramGraphqlObject,
		args: {
			slug: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(Diagram.genBySlug(args.slug));
		})
	}
}