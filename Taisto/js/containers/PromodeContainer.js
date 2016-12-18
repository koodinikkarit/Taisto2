import React from 'react';
import { connect } from 'react-redux';

import {
    MatrixTable,
    MatrixBoard
} from "../components";

var cpus = [
    {
        id: 1,
        name: "TykitysPC1"
    },
    {
        id: 2,
        name: "TykitysPC1"
    },
    {
        id: 3,
        name: "TykitysPC1"
    },
    {
        id: 4,
        name: "TykitysPC1"
    },
    {
        id: 5,
        name: "TykitysPC1"
    },
    {
        id: 6,
        name: "TykitysPC1"
    },
];

var cons = [
    {
        id: 1,
        name: "Tykkipiste 1",
        value: 1
    },
    {
        id: 2,
        name: "Tykkipiste2",
        value: 1
    },
    {
        id: 3,
        name: "Tykkipiste3",
        value: 1
    },
    {
        id: 4,
        name: "Tykkipiste4",
        value: 1
    }
];

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
                <MatrixTable cpus={cpus} cons={cons}/>
                <h2 id="Matriisivalikko">Matriisivalikko</h2>
                <MatrixBoard cpus={cpus} cons={cons}/>
                <h2 id="Defaulttilat">Default tilat</h2>
                <MatrixTable cpus={cpus} cons={cons}/>
            </div>
        )
    }
    });

//<MatrixTable />