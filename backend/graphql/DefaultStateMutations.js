import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
	GraphQLBoolean,
	GraphQLNonNull,
	GraphQLFloat
} from "graphql";

import {
	db,
	setDb,
	createDefaultState,
	insertKwmConnectionToDefaultState,
	insertVideoConnectionToDefaultState
} from "../TaistoService";

/**
 * Graphql objects
 */


import DefaultState from "./DefaultState";
import DefaultStateVideoConnection from "./DefaultStateVideoConnection";
import DefaultStateKwmConnection from "./DefualtStateKwmConnection";

export default {
	createDefaultState: {
		name: "CreateDefaultState",
		type: DefaultState,
		args: {
			slug: {
				type: new GraphQLNonNull(GraphQLString)
			},
			matrix: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(createDefaultState(args.slug, parseInt(args.matrix)));
		})
	},
	removeDefaultState: {
		name: "RemoveDefaultState",
		type: DefaultState,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve:(_, args) => new Promise((resolve, reject) => {
			var defaultState = db.defaultStates.get(parseInt(args.id));
			if (defaultState) {
				setDb(db.withMutations(db => {
					db.defaultStates = db.defaultStates.delete(defaultState.id);
					db.defaultStateVideoConnections = db.defaultStateVideoConnections.filterNot(p => p.defaultStateId === defaultState.id);
					db.defaultStateKwmConnections = db.defaultStateKwmConnections.filterNot(p => p.defaultStateId === defaultState.id);
				}));
				resolve(defaultState);
			}
		})
	},
	insertVideoConnectionToDefaultState: {
		name: "InsertVideoConnectionToDefaultState",
		type: DefaultStateVideoConnection,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			conPort: {
				type: new GraphQLNonNull(GraphQLString)
			},
			cpuPort: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(insertVideoConnectionToDefaultState(parseInt(args.id), parseInt(args.conPort), parseInt(args.cpuPort)));
		})
	},
	insertKwmConnectionToDefaultState: {
		name: "InsertKwmConnectionToDefaultState",
		type: DefaultStateVideoConnection,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			conPort: {
				type: new GraphQLNonNull(GraphQLString)
			},
			cpuPort: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(insertKwmConnectionToDefaultState(parseInt(args.id), parseInt(args.conPort), parseInt(args.cpuPort)));
		})
	},
	removeVideoConnectionFromDefaultState: {
		name: "RemoveVideoConnectionFromDefaultState",
		type: GraphQLBoolean,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			conPort: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var defaultState = db.defaultStates.get(parseInt(args.id));
			if (defaultState) {
				setDb(db.withMutations(db => {
					db.defaultStateVideoConnections = db.defaultStateVideoConnections.filterNot(p => p.defaultStateId === parseInt(args.id) && p.conPortId === parseInt(args.conPort));
				}));
				resolve(true);
			}
			resolve(false);
		})
	},
	removeKwmConnectionFromDefaultState: {
		name: "RemoveKwmConnectionFromDefaultState",
		type: GraphQLBoolean,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			},
			cpuPort: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			var defaultState = db.defaultStates.get(parseInt(args.id));
			if (defaultState) {
				setDb(db.withMutations(db => {
					db.defaultStateKwmConnections = db.defaultStateKwmConnections.filterNot(p => p.defaultStateId === parseInt(args.id) && p.cpuPortId === parseInt(args.cpuPort));
				}));
				resolve(true);
			}
			resolve(false);
		})
	}
}