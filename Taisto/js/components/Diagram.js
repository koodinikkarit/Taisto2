import React from 'react';
import {
    Link
} from "react-router";

import ActionShortcut from "./ActionShortcut";

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

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dragging: false
        }
    }
    render() {
        console.log(this.props.diagram);
        styles.customDiagramContainer.paddingBottom = (100 / this.props.aspectRatio) + "%";
        return (
            <div style={styles.customDiagramContainer}>
                {this.props.diagram && this.props.diagram.diagramScreens ? this.props.diagram.diagramScreens.map(diagramScreen => (
                    <ActionShortcut cpus={diagramScreen.cpuPorts} con={diagramScreen.conPort} />   
                )) : ""}

            </div>
        );
    }
}


                // <div onMouseDown={() => { this.setState({ dragging: true }) } } style={styles.customDiagramItem}>
                //     <ActionShortcut cpus={cpus} con={{ id: 1, name: "Tykki" }} />
                // </div>