import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} from "graphql";

/**
 * Business objects
 */
import Matrix from "../business/Matrix";

/**
 * Graphql objects
 */

import MatrixGraphqlObject from "./Matrix";
import ConPort from "./ConPort";
import CpuPort from "./CpuPort";

export default {
	matrixs: {
		name: "Matrixs",
		type: new GraphQLList(MatrixGraphqlObject),
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(Matrix.genAll());
		})
	},
	matrixById: {
		name: "MatrixById",
		type: MatrixGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(Matrix.gen(args.id));
		})
	},
	matrixBySlug: {
		name: "Matrix",
		type: MatrixGraphqlObject,
		args: {
			slug: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(Matrix.genBySlug(args.slug));
		})
	},
}