import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import MatrixSettings from "../components/MatrixSettings";

export default graphql(gql`
query ($slug: String!) {
    matrix(slug: $slug) {
        id
        slug
        ip
        port
        conPorts {
            id
        }
        cpuPorts {
            id
        }
    }
}`, {
    options: (ownProps) => ({
        variables: {
            slug: ownProps.params.slug
        }
    }),
    props: ({ ownProps, data: { matrix } }) => ({
        matrix
    })
})(MatrixSettings)