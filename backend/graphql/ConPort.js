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
    name: "ConPort",
    fields: () => ({
        id: {
            type: GraphQLString,
            resolve: port => String(port.get("id"))
        },
        slug: {
            type: GraphQLString,
            resolve: port => port.get("slug")
        },
        matrix: {
            type: Matrix,
            resolve: port => port.matrix
        },
        portNum: {
            type: GraphQLInt,
            resolve: port => port.get("portNum")
        }
    })
});
