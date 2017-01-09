import React from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import Promode from "../components/Promode";

import * as actions from "../actions/Promode";

const PromodeWithData = graphql(gql`
query {
    matrixs {
        id
        slug
        conPorts {
            id
            portNum
        }
        cpuPorts {
            id
            portNum
        }
    }
}
`, {
        props: ({ ownProps, data: { matrixs }}) => ({
            matrixs
        })
})(Promode);

export default connect(
    store => {
        return {
            videoConnections: store.matrix && store.matrix.videoConnections ? store.matrix.videoConnections.toJS() : { },
            kwmConnections: store.matrix && store.matrix.kwmConnections ? store.matrix.kwmConnections.toJS() : { }
        }
    },
    dispatch => bindActionCreators(actions, dispatch)
)(PromodeWithData);