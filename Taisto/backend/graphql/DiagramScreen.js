const GraphQLObjectType = require("graphql").GraphQLObjectType;
const GraphQLString = require("graphql").GraphQLString;
const GraphQLInt = require("graphql").GraphQLInt;
const GraphQLList = require("graphql").GraphQLList;

import ConPort from "./ConPort";
import CpuPort from "./CpuPort";

module.exports = new GraphQLObjectType({
    name: "DiagramScreen",
    fields: function() {
        return {
            id: {
                type: GraphQLString
            },
            conPort: {
                type: ConPort
            },
            cpuPorts: {
                type: new GraphQLList(CpuPort)
            }
        }
    }
});