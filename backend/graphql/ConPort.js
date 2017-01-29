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
            type: GraphQLString
        },
        slug: {
            type: GraphQLString
        },
        matrix: {
            type: Matrix,
            resolve: function (that, args) {
                return new Promise(function (resolve, reject) {

                });
            }
        },
        portNum: {
            type: GraphQLInt
        }
    })
});