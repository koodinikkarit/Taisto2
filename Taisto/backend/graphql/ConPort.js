const GraphQLObjectType = require("graphql").GraphQLObjectType;
const GraphQLString = require("graphql").GraphQLString;
const GraphQLInt = require("graphql").GraphQLInt;

import Matrix from "./MatrixParent";

export default new GraphQLObjectType({
    name: "ConPort",
    fields: () => ({
        id: {
            type: GraphQLString
        },
        matrix: {
            type: Matrix,
            resolve: function (that, args) {
                return new Promise(function (resolve, reject) {

                });
            }
        },
        conNum: {
            type: GraphQLInt
        }
    })
});