import React from 'react';
import { connect } from 'react-redux';

import MatrixTable from "../components/MatrixTable";
import MatrixBoard from "../components/MatrixBoard";

export default connect(
    store => {
        return {

        };
    }
)(class extends React.Component {
    render() {
        return (
            <div>
                <h2 id="matriisitaulu">Matriisitaulu</h2>
            </div>
        )
    }
    });

//<MatrixTable />