import React from 'react';
import ReactDOM from 'react-dom';
import {
    Link
} from "react-router";

export default class extends React.Component {
        render() {
            console.log(this.props.diagrams);
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

                // // <div>
                // //     {this.props.links.map(link => {
                // //         return <Link to={`/diagram/${link.name}`}><button style={{ height: buttonHeight, width: "100%", marginBottom: "2px" }}>{link.name}</button></Link>
                // //     })
                // //     }        
                // // </div>
                // <div>
                // <a href="/promode" style={{ height: buttonHeight, width: "32%", marginRight: "2%", fontSize: "30px" }}>
                //     Promode
                // </a>
                // <a href="#" style={{ height: buttonHeight, width: "32%" }}>
                //     Taulu
                // </a>
                // <a href="#" style={{ height: buttonHeight, width: "32%", marginLeft: "2%" }}>
                //     Valikko
                // </a>
                // </div>