import {
	GraphQLList,
	GraphQLNonNull
} from "graphql";

import DefaultState from "./DefaultState";

import {
	db
} from "../TaistoService";

export default {
	defaultStates: {
		name: "defaultStates",
		description: "makkara",
		type: new GraphQLList(DefaultState),
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(db.defaultStates);
		})
	},
	defaultStateBydId: {
		name: "DefaultStateBydId",
		type: DefaultState,
		args: {
			id: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(db.defaultStates.get(parseInt(args.id)));
		})
	},
	defaultStateBySlug: {
		name: "DefaultStateBySlug",
		type: DefaultState,
		args: {
			slug: {
				type: new GraphQLNonNull(GraphQLString)
			}
		},
		resolve: (_, args) => new Promise((resolve, reject) => {
			resolve(db.defaultStates.find(p => p.slug === args.slug));
		})
	}
}