import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'

import * as actions from "../actions/MatrixsMocs";

import MatrixsMock from "../components/MatrixsMock";

export default connect(
    store => {
        return {

        }
    },
    dispatch => bindActionCreators(actions, dispatch)
)(({props, actions})=> {

});