import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt
} from "graphql";

import ConPort from "./ConPort";
import CpuPort from "./CpuPort";

export default new GraphQLObjectType({
    name: "Matrix",
    fields: () => ({
        id: {
            type: GraphQLString,
            resolve: matrix => String(matrix.get("id"))
        },
        slug: {
            type: GraphQLString,
            resolve: matrix => matrix.get("slug")
        },
        ip: {
            type: GraphQLString,
            resolve: matrix => matrix.get("ip")
        },
        port: {
            type: GraphQLInt,
            resolve: matrix => matrix.get("port")
        },
        conPortAmount: {
            type: GraphQLInt,
            resolve: matrix => matrix.get("numberOfConPorts")
        },
        cpuPortAmount: {
            type: GraphQLInt,
            resolve: matrix => matrix.get("numberOfCpuPorts")
        },
        conPorts: {
            type: new GraphQLList(ConPort),
            resolve: matrix => matrix.conPorts.toArray()
        },
        cpuPorts: {
            type: new GraphQLList(CpuPort),
            resolve: matrix => matrix.cpuPorts.toArray()
        }
    })
});
