import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} from "graphql";

const fetchMatrixs = require("../matrix").fetchMatrixs;

import {
    fetchDiagrams,
    fetchDiagram
} from "../diagram";

import Diagram from "./Diagram";

import Matrix from "./Matrix";

module.exports = new GraphQLObjectType({
    name: "QueryType",
    fields: () => ({
        matrixs: {
            name: "Matrixs",
            type: new GraphQLList(Matrix),
            resolve: function (_, args) {
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
        },
        diagram: {
            name: "Diagram",
            type: Diagram,
            args: {
                slug: {
                    type: GraphQLString
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(fetchDiagram(args.slug));
            })
        }
    })
});