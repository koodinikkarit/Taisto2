const GraphQLObjectType = require("graphql").GraphQLObjectType;
const GraphQLString = require("graphql").GraphQLString;
const GraphQLInt = require("graphql").GraphQLInt;
const GraphQLList = require("graphql").GraphQLList;

const DiagramScreen = require("./DiagramScreen");

export default new GraphQLObjectType({
    name: "Diagram",
    fields: () => ({
        id: {
            type: GraphQLString
        },
        slug: {
            type: GraphQLString
        },
        diagramScreens: {
            type: new GraphQLList(DiagramScreen),
            resolve: function (that, args) {
                return new Promise((resolve, reject) => {
                    resolve(that.diagramScreens);
                });
            }
        }
    })
});