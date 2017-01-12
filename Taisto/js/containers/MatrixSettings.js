import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import MatrixSettings from "../components/MatrixSettings";

export default graphql(gql`
query matrixs($slug: String!) {
    matrix(slug: $slug) {
        id
        slug
        ip
        port
        conPorts {
            id
            slug
            portNum
        }
        cpuPorts {
            id
            slug
            portNum
        }
    }
}
`, {
    options: (ownProps) => ({
        variables: {
            slug: ownProps.params.slug
        }
    }),
    props: ({ ownProps, data: { matrix } }) => ({
        matrix
    })
})(graphql(gql`
mutation editMatrix($id: String!, $slug: String, $ip: String, $port: Int) {
    editMatrix(id: $id, slug: $slug, ip: $ip, port: $port) {
        slug
    }
}`, { name: "editMatrixMutation" })(graphql(gql`
mutation ediConPort($id: String!, $slug: String){
    editConPort(id: $id, slug: $slug) {
        id
        slug
    }
}`, { name: "editConPortMutation" })(graphql(gql`
mutation editCpuPort($id: String!, $slug: String){
    editCpuPort(id: $id, slug: $slug) {
        id
        slug
    }
}`, { name: "editCpuPortMutation" })(MatrixSettings))));