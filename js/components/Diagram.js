import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
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

class Diagram extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dragging: false
        }
    }
    render() {
        styles.customDiagramContainer.paddingBottom = (100 / this.props.aspectRatio) + "%";
        return (
            <ul className="list-group">
                {this.props.diagram && this.props.diagram.diagramScreens ? this.props.diagram.diagramScreens.map(diagramScreen => (
                    <li className="list-group-item">
                        <ActionShortcut diagramScreenId={diagramScreen.id} /> 
                    </li>  
                )) : ""}

            </ul>
        );
    }
}


export default graphql(gql`
query ($slug: String!) {
    diagram: diagramBySlug(slug: $slug) {
        id
        diagramScreens {
            id
            slug
            conPort {
                id
                slug
                portNum
            }
            cpuPorts {
                id
                slug
                portNum
            }
        }
    }
}`, {
        options: (ownProps) => ({
            variables: {
                slug: ownProps.params.slug
            }
        }),
        props: ({ ownProps, data: { diagram } }) => ({
            diagram
        })
})(Diagram);


                // <div onMouseDown={() => { this.setState({ dragging: true }) } } style={styles.customDiagramItem}>
                //     <ActionShortcut cpus={cpus} con={{ id: 1, name: "Tykki" }} />
                // </div>