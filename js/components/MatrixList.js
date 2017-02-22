import React from 'react';

import Settings from "../containers/Settings";
import ConnectingMatrix from "./ConnectingMatrix";

export default class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			connectingNewMatrix: false
		};
	}

	render() {
		return (
			<Settings active="matriisit">
				<div className="row">
					<div className="col-6">
						<h1>MatrixList</h1>
					</div>
					<div className="col-4">
						<button className="btn btn-success"
						onClick={e => {
							this.setState({ connectingNewMatrix: true });
						}}>Yhtistä uusi matriisi</button>
					</div>
				</div>
				<div className="row">
					<div className="col-6">
						<div>
							{this.state.connectingNewMatrix ?
							<ConnectingMatrix 
							 onMatrixCreated={() => {
								 this.setState({
									 connectingNewMatrix: false
								 });
							 }}
							/> : ""}
						</div>
						<div className="list-group">
							{this.props.matrixs ?
								this.props.matrixs.map(matrix => (
									<a className="list-group-item list-group-item-action"
										onClick={() => this.props.history.push(`/settings/matriisi/${matrix.slug}`)}>{matrix.slug}</a>
								)) : ""
							}
						</div>
					</div>
				</div>
			</Settings>
		)
	}
}