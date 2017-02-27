import React from 'react';
import ReactDOM from 'react-dom';
import {
    Link
} from "react-router";

export default class extends React.Component {
        render() {
            var buttonHeight = "60px";
            return (
                <div className="row">
                    <div className="col">
                        <div className="jumbotron">
                            <h1>Kaaviot</h1>
                        </div>
                        <div className="list-group">
                            {this.props.diagrams ? this.props.diagrams.map(diagram => (
                                <a href={"./diagram/" + diagram.slug} className="list-group-item list-group-item-action">
                                    {diagram.slug}
                                </a>
                            )) : ""}
                        </div>
                    </div>
                </div>   
        );
    }
}