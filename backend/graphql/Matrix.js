import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt
} from "graphql";

import ConPort from "./ConPort";
import CpuPort from "./CpuPort";
import { valueOf, valuesOf } from "./immutable";

export default new GraphQLObjectType({
    name: "Matrix",
    fields: () => ({
        id: {
            type: GraphQLString,
            resolve: matrix => String(valueOf(matrix, "id"))
        },
        slug: {
            type: GraphQLString,
            resolve: matrix => valueOf(matrix, "slug")
        },
        ip: {
            type: GraphQLString,
            resolve: matrix => valueOf(matrix, "ip")
        },
        port: {
            type: GraphQLInt,
            resolve: matrix => valueOf(matrix, "port")
        },
        conPortAmount: {
            type: GraphQLInt,
            resolve: matrix => valueOf(matrix, "numberOfConPorts")
        },
        cpuPortAmount: {
            type: GraphQLInt,
            resolve: matrix => valueOf(matrix, "numberOfCpuPorts")
        },
        conPorts: {
            type: new GraphQLList(ConPort),
            resolve: matrix => valuesOf(valueOf(matrix, "conPorts"))
        },
        cpuPorts: {
            type: new GraphQLList(CpuPort),
            resolve: matrix => valuesOf(valueOf(matrix, "cpuPorts"))
        }
    })
});
