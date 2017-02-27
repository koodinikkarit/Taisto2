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
import DiagramScreenCpuPortGraphqlObject from "./DiagramScreenCpuPort";

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
				type: new GraphQLNonNull(GraphQLString)
			},
			matrix: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(createDiagramScreen(parseInt(args.diagram), args.slug, parseInt(args.matrix), parseInt(args.conPort)));
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
		type: DiagramScreenCpuPortGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			cpuPort: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var cpuDiagramScreen = db.diagramScreenCpuPorts.find(p => p.id === parseInt(args.id) && p.cpuPortId === parseInt(args.cpuPort));
			if (!cpuDiagramScreen)
			resolve(addCpuToDiagramScreen(parseInt(args.id), parseInt(args.cpuPort)));
			else reject();
		})
	},
	removeCpuFromDiagramScreen: {
		name: "RemoveCpuFromDiagramScreen",
		type: GraphQLBoolean,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			cpuPort: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			setDb(db.withMutations(db => {
				db.diagramScreenCpuPorts = db.diagramScreenCpuPorts.filterNot(p => p.diagramScreenId === parseInt(args.id) && p.cpuPortId === parseInt(args.cpuPort));
			}));
			resolve(true);
		})
	},
	removeDiagramScreen: {
		name: "RemoveDiagraScreen",
		type: GraphQLBoolean,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			setDb(db.withMutations(db => {
				var diagramScreen = db.diagramScreens.get(parseInt(args.id));
				if (diagramScreen) {
					setDb(db.withMutations(db => {
						db.diagramScreens = db.diagramScreens.delete(diagramScreen.id);
						db.diagramScreenCpuPorts = db.diagramScreenCpuPorts.filterNot(p => p.diagramScreenId === diagramScreen.id);
					}));
					resolve(true);
				}
			}));
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