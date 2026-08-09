import {
	GraphQLObjectType,
	GraphQLString
} from "graphql";

import ConPort from "./ConPort";
import CpuPort from "./CpuPort";
import { valueOf } from "./immutable";

export default new GraphQLObjectType({
	name: "DefaultStateKwmConnection",
	fields: () => ({
		id: {
			type: GraphQLString,
			resolve: connection => String(valueOf(connection, "id"))
		},
		conPort: {
			type: ConPort,
			resolve: connection => valueOf(connection, "conPort")
		},
		cpuPort: {
			type: CpuPort,
			resolve: connection => valueOf(connection, "cpuPort")
		}
	})
});
