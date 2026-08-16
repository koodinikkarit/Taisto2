import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql";
import { executeConGroup } from "../TaistoService";

export default {
  executeConGroup: {
    name: "ExecuteConGroup",
    type: GraphQLBoolean,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
      cpuPortId: { type: new GraphQLNonNull(GraphQLString) }
    },
    resolve: (_, args) => executeConGroup(Number(args.id), Number(args.cpuPortId))
  }
};
