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

import DiagramGraphqlObject from "./Diagram";
import { valuesOf } from "./immutable";


export default {
	diagrams: {
		name: "diagrams",
		description: "Hakee kaikki kaaviot",
		type: new GraphQLList(DiagramGraphqlObject),
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(valuesOf(db.diagrams));
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
			resolve(db.diagrams.get(parseInt(args.id)));
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
			resolve(db.diagrams.find(p => p.get("slug") === args.slug));
		})
	}
}
