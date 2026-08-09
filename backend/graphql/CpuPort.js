import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

import Matrix from "./Matrix";

const valueOf = (record, key) => typeof record.get === "function" ? record.get(key) : record[key];

export default new GraphQLObjectType({
    name: "CpuPort",
    fields: () => ({
        id: {
            type: GraphQLString,
            resolve: port => String(valueOf(port, "id"))
        },
        slug: {
            type: GraphQLString,
            resolve: port => valueOf(port, "slug")
        },
        matrix: {
            type: Matrix,
            resolve: port => port.matrix
        },
        portNum: {
            type: GraphQLInt,
            resolve: port => valueOf(port, "portNum")
        }
    })
});
