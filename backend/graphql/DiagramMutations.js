import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull,
	GraphQLFloat
} from "graphql";

import {
	db,
	setDb,
	createDiagram
} from "../TaistoService";

/**
 * Graphql objects
 */

import DiagramGraphqlObject from "./Diagram";

export default {
	createDiagram: {
		name: "CreateDiagram",
		type: DiagramGraphqlObject,
		args: {
			slug: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(createDiagram(args.slug));
		})
	},
	editDiagram: {
		name: "EditDiagram",
		type: DiagramGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			slug: {
				type: GraphQLString
			},
			xPosition: {
				type: GraphQLFloat
			},
			yPosition: {
				type: GraphQLFloat
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var diagram = db.diagrams.get(parseInt(args.id));
			if (diagram) {
				setDb(db.withMutations(db => {
					db.diagrams = db.diagrams.withMutations(diagrams => {
						diagrams.set(diagram.id, diagram.withMutations(diagram => {
							if (args.slug) diagram.slug = args.slug;
						}))
					});
				}));
			}
		})
	},
	removeDiagram: {
		name: "RemoveDiagram",
		type: GraphQLBoolean,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var diagram = db.diagrams.get(parseInt(args.id));
			if (diagram) {
				setDb(db.withMutations(db => {
					db.diagrams = db.diagrams.delete(diagram.id);
					db.diagramScreens = db.diagramScreens.filterNot(p => p.diagramId === diagram.id);
					db.diagramScreenCpuPorts = db.diagramScreenCpuPorts.filterNot(p => p.diagramScreen.diagramId === diagram.id);
				}));
				resolve(true);
			}
		})
	}
}