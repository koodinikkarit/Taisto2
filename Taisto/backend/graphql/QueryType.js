import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} from "graphql";

import {
    fetchDiagrams,
    fetchDiagram
} from "../diagram";

import {
    fetchMatrixs,
    fetchMatrix,
    fetchMatrixById
} from "../MatrixManager";

import Diagram from "./Diagram";
import Matrix from "./Matrix";
import Timer from "./Timer";
import Lock from "./Lock";
import DefaultState from "./DefaultState";
import Translation from "./Translation";

/**
 * GraphqlObjects
 */

import WeeklyTimerGraphqlObject from "./WeeklyTimerGraphqlObject";
import CronTimerGraphqlObject from "./CronTimerGraphqlObject";

/**
 * Business logic objects
 */

import WeeklyTimersList from "../businessObjects/WeeklyTimersList";
import CronTimersList from "../businessObjects/CronTimersList";

export default new GraphQLObjectType({
    name: "QueryType",
    fields: () => ({
        matrixById: {
            name: "MatrixById",
            type: Matrix,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLString)
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(fetchMatrixById(args.id));
            })
        },
        matrix: {
            name: "Matrix",
            type: Matrix,
            args: {
                slug: {
                    type: new GraphQLNonNull(GraphQLString)
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(fetchMatrix(args.slug));
            })
        },
        matrixs: {
            name: "Matrixs",
            type: new GraphQLList(Matrix),
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(fetchMatrixs());
            })
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
        },
        timers: {
            name: "Timers",
            type: new GraphQLList(Timer),
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(
                [
                    {
                        id: "1", 
                        slug: "0", 
                        config: "1"
                    }
                ]);
            })
        },
        locks: {
            name: "locks",
            type: new GraphQLList(Lock),
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(
                    [
                        {
                            id: "1",
                            slug: "0"
                        }
                    ]
                )
            })
        },
        defaultStates: {
            name: "DefaultStates",
            type: new GraphQLList(DefaultState),
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(
                    [
                        {
                            id: "1",
                            slug: "0"
                        }
                    ]
                )
            })
        },
        translations: {
            name: "Translations",
            type: new GraphQLList(Translation),
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(
                    [
                        {
                            id: "1",
                            slug: "0"
                        }
                    ]
                )
            })
        },
        weeklyTimers: {
            name: "WeeklyTimers",
            type: new GraphQLList(WeeklyTimerGraphqlObject),
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(WeeklyTimersList.gen());
            })  
        },
        cronTimers: {
            name: "CronTimers",
            type: new GraphQLList(CronTimerGraphqlObject),
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(CronTimersList.gen());
            })
        }
    })
});