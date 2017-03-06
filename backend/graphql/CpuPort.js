import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

import Matrix from "./Matrix";

export default new GraphQLObjectType({
    name: "CpuPort",
    fields: () => ({
        id: {
            type: GraphQLString
        },
        slug: {
            type: GraphQLString
        },
        matrix: {
            type: Matrix
        },
        portNum: {
            type: GraphQLInt
        }
    })
});