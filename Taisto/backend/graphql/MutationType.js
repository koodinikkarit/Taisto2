const GraphQLObjectType = require("graphql").GraphQLObjectType;

module.exports = new GraphQLObjectType({
    name: "MutationType",
    fields: function () {
        return {
            createNewMatrix: {
                name: "createNewMatrix",
                
            }
        }
    }
});