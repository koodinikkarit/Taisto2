import React from 'react';
import ReactDOM from 'react-dom';
import MeasureIt from 'react-measure-it';
import {
    Link
} from "react-router";

import {
    ActionShortcut
} from "./";

function getWidth(element) {
    return ReactDOM.findDOMNode(element).parentNode.getBoundingClientRect().width
}

function getHeight(element) {
    return ReactDOM.findDOMNode(element).parentNode.getBoundingClientRect().height
}

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

var styles = {
    customDiagramContainer: {
        position: "absolute",
        border: "solid black 1px",
        width: "100%",
        overFlow: "hidden"
    },
    customDiagramItem: {
        cursor: "move",
        position: "absolute",
        left: "15%",
        top: "23%"
    }
};

export default
    MeasureIt({ getWidth, getHeight })(class extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                dragging: false
            }
        }
        render() {
            styles.customDiagramContainer.paddingBottom = (100 / this.props.aspectRatio) + "%";
            return (
                <div style={styles.customDiagramContainer}>
                    <div onMouseDown={() => { this.setState({ dragging: true }) }} style={styles.customDiagramItem}>
                        <ActionShortcut cpus={cpus} con={{id: 1, name: "Tykki"}}/>
                    </div>
                </div>
            );
        }
    });