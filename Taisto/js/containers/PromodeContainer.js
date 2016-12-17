import React from 'react';
import { connect } from 'react-redux';

import {
    MatrixTable
} from "../components";

export default connect(
    store => {
        return {

        };
    }
)(class extends React.Component {
    render() {
        return (
            <div>
                <MatrixTable cpus={[
                    {
                        name: "TykitysPC1"
                    },
                    {
                        name: "TykitysPC1"
                    },
                    {
                        name: "TykitysPC1"
                    },
                    {
                        name: "TykitysPC1"
                    },
                    {
                        name: "TykitysPC1"
                    },
                    {
                        name: "TykitysPC1"
                    },
                ]}
                    cons={[
                        {
                            name: "Tykkipiste 1",
                            value: 1
                        },
                        {
                            name: "Tykkipiste2",
                            value: 1
                        },
                        {
                            name: "Tykkipiste3",
                            value: 1
                        },
                        {
                            name: "Tykkipiste4",
                            value: 1
                        }
                ]}/>
            </div>
        )
    }
    });

//<MatrixTable />