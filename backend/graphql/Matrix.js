import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt
} from "graphql";

import ConPort from "./ConPort";
import CpuPort from "./CpuPort";

const valueOf = (record, key) => typeof record.get === "function" ? record.get(key) : record[key];

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
            resolve: matrix => matrix.conPorts && typeof matrix.conPorts.toArray === "function" ? matrix.conPorts.toArray() : matrix.conPorts || []
        },
        cpuPorts: {
            type: new GraphQLList(CpuPort),
            resolve: matrix => matrix.cpuPorts && typeof matrix.cpuPorts.toArray === "function" ? matrix.cpuPorts.toArray() : matrix.cpuPorts || []
        }
    })
});
