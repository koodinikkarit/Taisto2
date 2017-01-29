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
			console.log("args", args);
			resolve(DiagramScreen.new({
				slug: args.slug,
				diagram: args.diagram,
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
		}
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
	}
}