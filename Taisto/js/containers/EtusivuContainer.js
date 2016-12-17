import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';


import {
    EtusivuComponent
} from "../components";



export default connect(
    store => {
        return {

        };
    }
)(
    class extends React.Component {
    render() {
        return (
            <EtusivuComponent links={[
                {
                    name: "Ylasali"
                },
                {
                    name: "Alasali"
                }
            ]} />
        )
    }
});