import React from 'react';
import { graphql } from '@apollo/client/react/hoc';
import gql from 'graphql-tag';
import {
    Link
} from "react-router-dom";

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
        const diagram = this.props.diagram;
        return (
            <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "18px 0 48px" }}>
                <div style={{ marginBottom: "24px" }}>
                    <h1 style={{ marginBottom: "6px" }}>{diagram ? diagram.slug : "Kaavio"}</h1>
                    <p style={{ margin: 0, color: "#64748b" }}>Valitse jokaiselle näytölle haluamasi lähde.</p>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                    {diagram && diagram.diagramScreens ? diagram.diagramScreens.map(diagramScreen => (
                        <li key={diagramScreen.id}>
                            <ActionShortcut diagramScreenId={diagramScreen.id} />
                        </li>
                    )) : ""}
                </ul>
                {diagram && !diagram.diagramScreens.length && <div className="alert alert-info">Kaaviossa ei ole vielä näyttöjä.</div>}
            </main>
        );
    }
}


export default graphql(gql`
query ($slug: String!) {
    diagram: diagramBySlug(slug: $slug) {
        id
		slug
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
                slug: ownProps.match.params.slug
            }
        }),
        props: ({ ownProps, data: { diagram } }) => ({
            diagram
        })
})(Diagram);


                // <div onMouseDown={() => { this.setState({ dragging: true }) } } style={styles.customDiagramItem}>
                //     <ActionShortcut cpus={cpus} con={{ id: 1, name: "Tykki" }} />
                // </div>
