import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import Settings from "../containers/Settings";

class DefaultStatesSettingsList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			newSlug: "",
			creatingDefaultState: false,
			selectedMatrix: ""
		};
	}

	render() {
		var selectedMatrix = this.state.selectedMatrix ? this.state.selectedMatrix : this.props.matrixs && this.props.matrixs.length > 0 ? this.props.matrixs[0].id : null;

		return (
			<Settings active="oletustilat">
				<div className="row">
					<div className="col">
						<h1>Oletustilat</h1>
					</div>
					<div className="col">
						<button className="btn btn-success"
						 onClick={e => {
							 this.setState({
								 creatingDefaultState: true
							 });
						 }}>
							Uusi oletustila
						</button>
					</div>
				</div>
				<hr/>
				{this.state.creatingDefaultState ? 
				<div className="row">
					<div className="col-xl-4">
						<div className="row">
							<div className="col-xl-4" style={{ fontSize: "20px" }}>
								Tunniste:
							</div>
							<div className="col-xl-8">
								<input className="form-control" value={this.state.newSlug}
								 onChange={e => {
									 this.setState({
										 newSlug: e.target.value
									 });
								 }} />
							</div>
						</div>
						<div className="row">
							<div className="col-xl-4" style={{ fontSize: "20px" }}>
								Matriisi:
							</div>
							<div className="col-xl-8">
								<select className="form-control" value={selectedMatrix}
								 onChange={e => {
									 this.setState({
										 selectedMatrix: e.target.value
									 })
								 }}>
								 {this.props.matrixs ? 
								  this.props.matrixs.map(matrix => (
									<option value={matrix.id}>{matrix.slug}</option>
								  )) : ""}
								</select>
							</div>
						</div>
						<br />
						<div className="row">
							<div className="col">
								<button className="btn"
								 onClick={e => {
									 this.setState({
										 newSlug: "",
										 creatingDefaultState: false
									 });
								 }}>
									Peruuta
								</button>
							</div>
							<div className="col">
								<button className="btn btn-success"
								 onClick={e => {
									 this.props.createDefaultState({
										 slug: this.state.newSlug,
										 matrix: selectedMatrix
									 }).then(data => {
										this.setState({
											newSlug: "",
											creatingDefaultState: false
										});
									 });
								 }}>
									Luo
								</button>
							</div>
						</div>
					</div>
					<div className="col-xl-8">
					</div>
				</div> : ""}
				<br/>
			<div className="row">
				<div className="col-xl-6">
					<ul className="list-group">
						{this.props.defaultStates ? 
						 this.props.defaultStates.map(defaultState => (
							<li key={defaultState.id} className="list-group-item list-group-item-action"
						 	onClick={e => {
								 this.props.history.push(`/settings/oletustila/${defaultState.slug}`)
						 	}}>
						 		<div className="row"  style={{ width: "100%" }}>
							 		<div className="col-8">
										{defaultState.slug}
									</div>
									<div className="col-4">
										<button className="btn btn-danger"
										 onClick={e => {
											e.stopPropagation();
											this.props.removeDefaultState({
												id: defaultState.id
											});
										 }}>
											Poista
										</button>
									</div>
								</div>
							</li>
						 )) : ""}
					</ul>
				</div>
			</div>
			</Settings>
		);
	}
}

export default compose(
	graphql(gql`
	query defaultStates {
		defaultStates {
			id
			slug
		}
	}`, {
		props: ({ ownProps, data: { defaultStates }}) => ({
			defaultStates
		})
	}),
	graphql(gql`
	query matrixs {
		matrixs {
			id
			slug
		}
	}`, {
		props: ({ ownProps, data: { matrixs }}) => ({
			matrixs
		})
	}),
	graphql(gql`
	mutation ($slug: String!, $matrix: String!) {
		defaultState: createDefaultState(slug: $slug, matrix: $matrix) {
			id
			slug
		}
	}`, {
		props: ({ ownProps, mutate }) => {
			return {
				createDefaultState({ slug, matrix }) {
					return mutate({
						variables: {
							slug,
							matrix
						},
						updateQueries: {
							defaultStates: (prev, { mutationResult }) => {
								return Object.assign({}, prev, {
									defaultStates: [...prev.defaultStates, mutationResult.data.defaultState]
								});
							}
						}
					})
				}
			}
		}
	}),
	graphql(gql`
	mutation ($id: String!) {
		removeDefaultState(id: $id) { 
			id
		}
	}`, {
		props: ({ ownProps, mutate }) => {
			return {
				removeDefaultState({ id }) {
					return mutate({
						variables: {
							id
						},
						updateQueries: {
							defaultStates: (prev, { mutationResult }) => {
								return Object.assign({}, prev, {
									defaultStates: prev.defaultStates.filter(p => p.id !== id)
								});
							}
						}
					})
				}
			}
		}
	})
)(DefaultStatesSettingsList);