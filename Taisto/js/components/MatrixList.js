import React from 'react';

import Settings from "../containers/Settings";

export default class extends React.Component {
	render() {
		console.log(this.props.matrixs);
		return (
			<Settings active="matriisit">
				<h1>MatrixList</h1>
				<div className="list-group">
					{this.props.matrixs ?
						this.props.matrixs.map(matrix => (
							<a className="list-group-item list-group-item-action" 
							onClick={() => this.props.history.push(`/settings/matriisi/${matrix.slug}`)}>{matrix.slug}</a>
						)) : ""
					}
				</div>
			</Settings>
		)
	}
}