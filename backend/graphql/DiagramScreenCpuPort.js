import {
	GraphQLObjectType,
	GraphQLString
} from "graphql";

import DiagramScreen from "./DiagramScreen";
import CpuPort from "./CpuPort";

export default new GraphQLObjectType({
	name: "DiagramScreenCpuPort",
	fields: () => ({
		id: {
			type: GraphQLString
		},
		diagramScreen: {
			type: DiagramScreen,
		},
		cpuPort: {
			type: CpuPort
		}
	})
});