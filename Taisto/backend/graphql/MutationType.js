import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull,
    GraphQLInt
} from "graphql";

import Matrix from "./Matrix";
import ConPort from "./ConPort";
import CpuPort from "./CpuPort";

import {
    editMatrix,
    editConPort,
    editCpuPort
} from "../MatrixManager";

export default new GraphQLObjectType({
    name: "MutationType",
    fields: () => ({
        connectNewMatrix: {
            name: "ConnectNewMatrix",
            type: Matrix,
            args: {
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
            }
        },
        editMatrix: {
            name: "EditMatrix",
            type: Matrix,
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
                resolve(editMatrix(args));
            })
        },
        editConPort: {
            name: "EditConPort",
            type: ConPort,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLString)
                },
                slug: {
                    type: GraphQLString
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(editConPort(args));
            })
        },
        editCpuPort: {
            name: "EditCpuPort",
            type: CpuPort,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLString)
                },
                slug: {
                    type: GraphQLString
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(editCpuPort(args));
            })
        }
    })
});