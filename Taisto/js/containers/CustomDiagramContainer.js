import React from 'react';
import { connect } from 'react-redux';

import {
    CustomableDiagram
} from "../components/"

export default connect(
    store => {
        return {

        };
    }
)(class extends React.Component {
    render() {
        return (
            <div>
                <h1>terve {this.props.params.diagramid}</h1>
                <CustomableDiagram aspectRatio={16/9} />
            </div>
        )
    }
});