import React from 'react';
import { connect } from 'react-redux'
import { graphql } from '@apollo/client/react/hoc';
import { compose } from 'redux';
import gql from 'graphql-tag';

import Settings from "../containers/Settings";
import ConnectingMatrix from "./ConnectingMatrix";
import MatrixConnectionStatus from "./MatrixConnectionStatus";
import { I18nContext } from "../i18n";

class MatrixList extends React.Component {
	static contextType = I18nContext;
	constructor(props) {
		super(props);
		this.state = {
			connectingNewMatrix: false
		};
	}

	render() {
		const { t } = this.context;
		return (
			<Settings active="matriisit">
				<div className="row">
					<div className="col-6">
						<h1>{t("matrices")}</h1>
					</div>
					<div className="col-4">
						<button className="btn btn-success"
						onClick={e => {
							this.setState({ connectingNewMatrix: true });
					}}>{t("connectMatrix")}</button>
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
									<a key={matrix.id} className="list-group-item list-group-item-action"
									 onClick={() => this.props.history.push(`/settings/matriisi/${matrix.slug}`)}>		
									<div className="row" style={{ width: "100%" }}>
										<div className="col">
										{matrix.slug + "  "}
										</div>
										<div className="col">
											<MatrixConnectionStatus t={t} code={this.props.connectionStates && this.props.connectionStates.get(String(matrix.id))} />
										</div>
										<div className="col">
											<button className="btn btn-danger"
											 onClick={(e) => {
												 e.stopPropagation();
												 this.props.removeMatrix({
													 id: matrix.id
												 });
											 }}>{t("remove")}</button>
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
