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
            type: GraphQLString
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
        },
        conPorts: {
            type: new GraphQLList(ConPort)
        },
        cpuPorts: {
            type: new GraphQLList(CpuPort)
        }
    })
});