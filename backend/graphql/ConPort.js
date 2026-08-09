import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull
} from "graphql";

import Matrix from "./Matrix";
import { valueOf } from "./immutable";

export default new GraphQLObjectType({
    name: "ConPort",
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
            resolve: port => valueOf(port, "matrix")
        },
        portNum: {
            type: GraphQLInt,
            resolve: port => valueOf(port, "portNum")
        }
    })
});
