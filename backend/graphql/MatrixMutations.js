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

import Matrix from "../business/Matrix";
import ConPort from "../business/ConPort";
import CpuPort from "../business/CpuPort";


/**
 * Graphql objects
 */

import MatrixGraphqlObject from "./Matrix";
import ConPortGraphqlObject from "./ConPort";
import CpuPortGraphqlObject from "./CpuPort";

export default {
	connectMatrix: {
		name: "ConnectMatrix",
		type: MatrixGraphqlObject,
		args: {
			slug: {
				type: new GraphQLNonNull(GraphQLString)
			},
			ip: {
				type: new GraphQLNonNull(GraphQLString)
			},
			port: {
				type: new GraphQLNonNull(GraphQLInt)
			},
			conPortAmount: {
				type: new GraphQLNonNull(GraphQLInt)
			},
			cpuPortAmount: {
				type: new GraphQLNonNull(GraphQLInt)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(Matrix.new({
				slug: args.slug,
				ip: args.ip,
				port: args.port,
				conPortAmount: args.conPortAmount,
				cpuPortAmount: args.cpuPortAmount
			}));
		})
	},
	editMatrix: {
		name: "EditMatrix",
		type: MatrixGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			slug: {
				type: GraphQLString
			},
			ip: {
				type: GraphQLString
			},
			port: {
				type: GraphQLInt
			},
			conPortAmount: {
				type: GraphQLInt
			},
			cpuPortAmount: {
				type: GraphQLInt
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var matrix = Matrix.gen(args.id);
			if (args.slug) matrix.slug = args.slug;
			if (args.ip) matrix.ip = args.ip;
			if (args.port) matrix.port = args.port;
			resolve(matrix);
		})
	},
	removeMatrix: {
		name: "RemoveMatrix",
		type: GraphQLBoolean,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(Matrix.del(args.id));
		})
	},
	editConPort: {
		name: "EditConPort",
		type: ConPortGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			slug: {
				type: GraphQLString
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var conPort = ConPort.gen(args.id);
			if (args.slug) conPort.slug = args.slug;
			resolve(conPort);
		})
	},
	editCpuPort: {
		name: "EditCpuPort",
		type: CpuPortGraphqlObject,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			slug: {
				type: GraphQLString
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var cpuPort = CpuPort.gen(args.id);
			if (args.slug) cpuPort.slug = args.slug;
			resolve(cpuPort);
		})
	}
}	
