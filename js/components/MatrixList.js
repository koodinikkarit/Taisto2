import React from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import Settings from "../containers/Settings";
import ConnectingMatrix from "./ConnectingMatrix";

function getConnectionStateMessage(code) {
	switch(code) {
		case "ADDRESS_NOT_FOUND":
			return <span style={{color: "red" }}>Osoite on virheellinen</span>;
		case "CONNECTED":
			return <span style={{color: "green" }}>Yhdistetty</span>;
		case "DISCONNECTED":
			return <span style={{color: "red" }}>Katkaistu</span>; 
		default:
			return "";
	}
}

class MatrixList extends React.Component {
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
						<h1>Matriisit</h1>
					</div>
					<div className="col-4">
						<button className="btn btn-success"
						onClick={e => {
							this.setState({ connectingNewMatrix: true });
						}}>Yhtistä uusi matriisi</button>
					</div>
				</div>
				<div className="row">
					<div className="col-xl-6">
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
									 onClick={() => this.props.history.push(`/settings/matriisi/${matrix.slug}`)}>		
									<div className="row" style={{ width: "100%" }}>
										<div className="col">
										{matrix.slug + "  "}
										</div>
										<div className="col">
											{this.props.connectionStates ? 
											getConnectionStateMessage(this.props.connectionStates.get(matrix.id))
										 	: ""}
										</div>
										<div className="col">
											<button className="btn btn-danger"
											 onClick={(e) => {
												 e.stopPropagation();
												 this.props.removeMatrix({
													 id: matrix.id
												 });
											 }}>Poista</button>
										</div>
									</div>
									</a>
								)) : ""
							}
						</div>
					</div>
				</div>
			</Settings>
		)
	}
}

export default compose(
	graphql(gql`
	query matrixs {
		matrixs {
			id
			slug
		}
	}
	`, {
		props: ({ ownProps, data: { matrixs } }) => ({
			matrixs
		})
	}),
	graphql(gql`
    mutation removeMatrix($id: String!) {
        removeMatrix(id: $id)
    }`, {
		props: ({ownProps, mutate}) => ({
			removeMatrix({id}) {
				return mutate({
					variables: {
						id
					},
					updateQueries: {
						matrixs: (prev, { mutationResult }) => {
							return Object.assign({}, prev, {
								matrixs: prev.matrixs.filter(p => p.id !== id)
							});
						} 
					}
				})
			}
		})
	}),
	connect(
		state => {
			return {
				connectionStates: state.matrix ? state.matrix.connectionStates : null
			}
		}
	)
)(MatrixList);