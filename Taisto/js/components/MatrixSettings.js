import React from 'react';
import Settings from "../containers/Settings";

export default class extends React.Component {
    render() {
        console.log("slug on ", this.props.slug);
        if (this.props.matrix) {
        return (
            <Settings active="matriisit">
                <div className="row">
                    <div className="row">
                        <h3>Tunniste</h3>
                    </div>
                    <div className="row">
                        <input type="text" value={this.props.matrix.slug} />
                    </div>
                </div>
                <h1>{this.props.matrix.slug}</h1>

            </Settings>
        )
        } else {
            return (
                <h1>EI matriisia</h1>
            )
        }
    }
}