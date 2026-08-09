import {
	GraphQLObjectType,
	GraphQLString
} from "graphql";

import DiagramScreen from "./DiagramScreen";
import CpuPort from "./CpuPort";
import { valueOf } from "./immutable";

export default new GraphQLObjectType({
	name: "DiagramScreenCpuPort",
	fields: () => ({
		id: {
			type: GraphQLString,
			resolve: connection => String(valueOf(connection, "id"))
		},
		diagramScreen: {
			type: DiagramScreen,
			resolve: connection => valueOf(connection, "diagramScreen")
		},
		cpuPort: {
			type: CpuPort,
			resolve: connection => valueOf(connection, "cpuPort")
		}
	})
});
