import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLList
} from "graphql";

export default new GraphQLObjectType({
    name: "MatrixParent",
    fields: () => ({
        id: {
            type: GraphQLString
        },
        ip: {
            type: GraphQLString
        },
        port: {
            type: GraphQLInt
        }
    })
});