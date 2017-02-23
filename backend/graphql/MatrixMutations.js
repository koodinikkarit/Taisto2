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
	connectMarix,
	removeMatrix
} from "../TaistoService";

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
			resolve(connectMarix(args.ip, args.port, args.slug,
			args.conPortAmount, args.cpuPortAmount));
			// resolve(Matrix.new({
			// 	slug: args.slug,
			// 	ip: args.ip,
			// 	port: args.port,
			// 	conPortAmount: args.conPortAmount,
			// 	cpuPortAmount: args.cpuPortAmount
			// }));
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
			if (db.matrixs.get(parseInt(args.id))) {
				removeMatrix(parseInt(args.id));
				resolve(true);
			} else resolve(false);

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
			setDb(db.withMutations(db => {
				db.conPorts = db.conPorts.withMutations(conPorts => {
					var conPort = conPorts.get(parseInt(args.id));
					if (conPort) {
						conPort = conPort.withMutations(conPort => {
							if (args.slug) conPort.set("slug", args.slug);
							resolve(conPort);
						});
						conPorts.set(parseInt(args.id), conPort);
					}
				});
			}));		
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
			setDb(db.withMutations(db => {
				db.cpuPorts = db.cpuPorts.withMutations(cpuPorts => {
					var cpuPort = cpuPorts.get(parseInt(args.id));
					if (cpuPort) {
						cpuPort = cpuPort.withMutations(cpuPort => {
							if (args.slug) cpuPort.set("slug", args.slug);
							resolve(cpuPort);
						});
						cpuPorts.set(parseInt(args.id), cpuPort);
					}
				});
			}));
		})
	}
}
