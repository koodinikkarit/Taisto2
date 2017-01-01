const GraphQLObjectType = require("graphql").GraphQLObjectType;
const GraphQLString = require("graphql").GraphQLString;
const GraphQLInt = require("graphql").GraphQLInt;
const GraphQLList = require("graphql").GraphQLList;

const DiagramScreen = require("./DiagramScreen");

module.exports = new GraphQLObjectType({
    name: "Diagram",
    fields: function() {
        return {
            id: {
                type: GraphQLString
            },
            diagramScreens: {
                type: new GraphQLList(DiagramScreen),
                resolve: function (that, args) {
					console.log(that);
                    return new Promise((resolve, reject) => {
						resolve(that.diagramScreens);
                    });
                }
            }
        }
    }
});