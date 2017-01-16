import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull,
    GraphQLInt,
    GraphQLBoolean
} from "graphql";

/**
 * Graphql objects
 */

import Matrix from "./Matrix";
import ConPort from "./ConPort";
import CpuPort from "./CpuPort";
import WeeklyTimerGraphqlObject from "./WeeklyTimerGraphqlObject";
import CronTimerGraphqlObject from "./CronTimerGraphqlObject";
import VideoConnectionGraphqlObject from "./VideoConnectionGraphqlObject";

/**
 * Business objects
 */

import WeeklyTimer from "../businessObjects/WeeklyTimer";
import WeeklyTimersList from "../businessObjects/WeeklyTimersList";
import VideoConnection from "../businessObjects/MatrixVideoConnection";

import {
    editMatrix,
    editConPort,
    editCpuPort
} from "../MatrixManager";

export default new GraphQLObjectType({
    name: "MutationType",
    fields: () => ({
        connectNewMatrix: {
            name: "ConnectNewMatrix",
            type: Matrix,
            args: {
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
                }
            }
        },
        editMatrix: {
            name: "EditMatrix",
            type: Matrix,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLString)
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
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(editMatrix(args));
            })
        },
        editConPort: {
            name: "EditConPort",
            type: ConPort,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLString)
                },
                slug: {
                    type: GraphQLString
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(editConPort(args));
            })
        },
        editCpuPort: {
            name: "EditCpuPort",
            type: CpuPort,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLString)
                },
                slug: {
                    type: GraphQLString
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {
                resolve(editCpuPort(args));
            })
        },
        createWeeklyTimer: {
            name: "CreateWeeklyTimer",
            type: WeeklyTimerGraphqlObject,
            args: {
                slug: {
                    type: GraphQLString
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {
                WeeklyTimer.new(args).then(newTimer => {         
                    WeeklyTimersList.insertWeeklyTimer(newTimer.id);
                    resolve(newTimer);
                })
            })
        },
        createCronTimer: {
            name: "CreateCronTimer",
            type: CronTimerGraphqlObject,
            args: {
                slug: {
                    type: new GraphQLNonNull(GraphQLString)
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {

            })
        },
        editWeeklyTimer: {
            name: "EditWeeklyTimer",
            type: WeeklyTimerGraphqlObject,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLString)
                },
                slug: {
                    type: GraphQLString
                },
                minutes: {
                    type: GraphQLInt
                },
                hours: {
                    type: GraphQLInt
                },
                active: {
                    type: GraphQLBoolean
                },
                monday: {
                    type: GraphQLBoolean
                },
                tuesday: {
                    type: GraphQLBoolean
                },
                wednesday: {
                    type: GraphQLBoolean
                },
                thursday: {
                    type: GraphQLBoolean
                },
                friday: {
                    type: GraphQLBoolean
                },
                saturday: {
                    type: GraphQLBoolean
                },
                sunday: {
                    type: GraphQLBoolean
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {
                WeeklyTimer.gen(args.id).then(
                    timer => {
                        timer.mutate(p => {
                            if (args.slug != null) p.slug = args.slug;
                            if (args.minutes != null) p.minutes = args.minutes;
                            if (args.hours != null) p.hours = args.hours;
                            if (args.active != null) p.active = args.active;
                            if (args.monday != null) p.monday = args.monday;
                            if (args.tuesday != null) p.tuesday = args.tuesday;
                            if (args.wednesday != null) p.wednesday = args.wednesday;
                            if (args.thursday != null) p.thursday = args.thursday;
                            if (args.friday != null) p.friday = args.friday;
                            if (args.saturday != null) p.saturday = args.saturday;
                            if (args.sunday != null) p.sunday = args.sunday;
                            WeeklyTimer.gen(args.id).then(
                                timer => {
                                    resolve(timer);
                                }
                            );
                        });                       
                    }
                );
            })
        },
        removeWeeklyTimer: {
            name: "removeWeeklyTimer",
            type: GraphQLString,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLString)
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {
                WeeklyTimer.del(args.id);
                resolve(args.id);
            })
        },
        addVideoConnectionToWeeklyTimer: {
            name: "addVideoConnectionToWeeklyTimer",
            type: VideoConnectionGraphqlObject,
            args: {
                weeklyTimer: {
                    type: GraphQLString
                },
                matrix: {
                    type: GraphQLString
                },
                conPort: {
                    type: GraphQLString
                },
                cpuPort: {
                    type: GraphQLString
                }
            },
            resolve: (_, args) => new Promise((resolve, reject) => {

            })
        }
    })
});