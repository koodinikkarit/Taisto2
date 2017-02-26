import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

import {
	db,
	setDb,
	createDiagramScreen,
	addCpuToDiagramScreen
} from "../TaistoService";

/**
 * Graphql objects
 */

import DiagramScreenGraphqlObject from "./DiagramScreen";

export default {
	createDiagramScreen: {
		name: "CreateDiagram",
		type: DiagramScreenGraphqlObject,
		args: {
			diagram: {
				type: new GraphQLNonNull(GraphQLString)
			},
			slug: {
				type: new GraphQLNonNull(GraphQLString)
			},
			conPort: {
				type: GraphQLString
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(createDiagramScreen(parseInt(args.diagram), args.slug, parseInt(args.conPort)));
		})
	},
	editDiagramScreen: {
		name: "EditDiagramScreen",
		type: DiagramScreenGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			slug: {
				type: GraphQLString
			},
			conPort: {
				type: GraphQLString
			},
			matrix: {
				type: GraphQLString
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var diagramScreen = db.diagramScreens.get(parseInt(args.id));
			if (diagramScreen) {
				setDb(db.withMutations(db => {
					db.diagramScreens = diagramScreens.set(diagramScreen.id, diagramScreen.withMutations(diagramScreen => {
						if (args.slug) diagramScreen.slug = args.slug;
						if (args.conPort) diagramScreen.conPortId = parseInt(args.conPort);
						if (args.matrix) diagramScreen.matrixId = parseInt(args.matrix);
					}));
				}));
			}
		})
	},
	addCpuToDiagramScreen: {
		name: "AddCpuToDiagramScreen",
		type: DiagramScreenGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			cpuPort: {
				type: GraphQLString
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(addCpuToDiagramScreen(parseInt(args.id), parseInt(cpuPort)));
		})
	},
	changeMatrixOfDiagramScreen: {
		name: "ChangeMatrixOfDiagramScreen",
		type: DiagramScreenGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			matrix: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var diagramScreen = DiagramScreen.gen(args.id);
			diagramScreen.then(diagramScreen => {
				diagramScreen.matrix = args.matrix;
			})
		})
	}
}