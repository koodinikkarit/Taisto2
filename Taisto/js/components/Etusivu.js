import React from 'react';
import ReactDOM from 'react-dom';
import {
    Link
} from "react-router";

export default class extends React.Component {
        render() {
            var buttonHeight = "60px";
        return (
            <div style={{ padding: "10%" }}>
                <h3>Kappaa</h3>
                {this.props.diagrams ?
                this.props.diagrams.map(diagram => (
                    <Link key={diagram.id} to={`/diagram/${diagram.slug}`}><button style={{ height: buttonHeight, width: "100%", marginBottom: "2px" }}>{diagram.slug}</button></Link>
                )) : ""}

            </div>       
        );
    }
}