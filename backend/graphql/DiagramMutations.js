import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull,
	GraphQLFloat
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
	createDiagram: {
		name: "CreateDiagram",
		type: DiagramGraphqlObject,
		args: {
			slug: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(Diagram.new({
				slug: args.slug
			}));
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
		}
	},

}