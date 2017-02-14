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
			resolve(DiagramScreen.new({
				slug: args.slug,
				diagramId: args.diagram,
				conPort: args.conPort
			}));
		})
	},
	editDiagramScreen: {
		name: "EditDiagram",
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
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			
		})
	},
	addCpuToDiagramScreen: {
		name: "AddCpuToDiagramScreen",
		type: DiagramScreenGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			conPort: {
				type: GraphQLString
			}
		}
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