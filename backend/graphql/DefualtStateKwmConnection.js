import {
	GraphQLObjectType,
	GraphQLString
} from "graphql";

import ConPort from "./ConPort";
import CpuPort from "./CpuPort";

export default new GraphQLObjectType({
	name: "DefaultStateKwmConnection",
	fields: () => ({
		id: {
			type: GraphQLString
		},
		conPort: {
			type: ConPort
		},
		cpuPort: {
			type: CpuPort
		}
	})
});