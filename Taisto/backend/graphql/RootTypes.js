const GraphQLSchema = require("graphql").GraphQLSchema;

const QueryType = require("./QueryType");
const MutationType = require("./MutationType");

export default new GraphQLSchema({
    query: QueryType
    //mutation: MutationType
});