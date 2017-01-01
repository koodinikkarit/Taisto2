
const GraphQLObjectType = require("graphql").GraphQLObjectType;
const GraphQLString = require("graphql").GraphQLString;
const GraphQLInt = require("graphql").GraphQLInt;
const GraphQLList = require("graphql").GraphQLList;

import ConPort from "./ConPort";
import CpuPort from "./CpuPort";

console.log("matrix conport", ConPort, "CpuPort", CpuPort);

export default new GraphQLObjectType({
    name: "Matrix",
    fields: () => ({
        id: {
            type: GraphQLString
        },
        ip: {
            type: GraphQLString
        },
        port: {
            type: GraphQLInt
        },
        conPorts: {
            type: new GraphQLList(ConPort)
        },
        cpuPorts: {
            type: new GraphQLList(CpuPort)
        }
    })
});