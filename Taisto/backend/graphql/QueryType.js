const GraphQLObjectType = require("graphql").GraphQLObjectType;
const GraphQLList = require("graphql").GraphQLList;

const Diagram = require("./Diagram");
const fetchMatrixs = require("../matrix").fetchMatrixs;
const fetchDiagrams = require("../diagram").fetchDiagrams;

import Matrix from "./Matrix";

console.log("matrixon", Matrix);

module.exports = new GraphQLObjectType({
    name: "QueryType",
    fields: () => ({
        matrixs: {
            name: "Matrixs",
            type: new GraphQLList(Matrix),
            resolve: function (_, args) {
                console.log("palautetaan matrix");
                return new Promise(function (resolve, reject) {
                    resolve(fetchMatrixs());
                });
            }
        },
        diagrams: {
            name: "Diagrams",
            type: new GraphQLList(Diagram),
            resolve: function (_, args) {
                return new Promise(function (resolve, reject) {
                    resolve(fetchDiagrams());
                });
            }
        }
    })
});