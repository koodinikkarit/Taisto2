import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

class DefaultStatesList extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="row">
				<div className="col">
					<div className="jumbotron">
						<h1>Oletustilat</h1>
					</div>
					<ul className="list-group">
					{this.props.defaultStates ? 
					 this.props.defaultStates.map(defaultState => (
						 <li className="list-group-item">
						 	<div className="row" style={{ width: "100%" }}>
							 	<div className="col" style={{ fontSize: "25px" }}>
								 	{defaultState.slug}
								</div>
								<div className="col">
									<button className="btn btn-info"
									 onClick={e => {
										this.props.executeDefaultState({
											id: defaultState.id
										});
									 }}>
										Suorita
									</button>
								</div>
							</div>
						 </li>
					 )) : ""}
					</ul>
				</div>
			</div>
		)
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
	mutation ($id: String!) {
		executeDefaultState(id: $id)
	}`, {
		props: ({ ownProps, mutate }) => {
			return {
				executeDefaultState({ id }) {
					return mutate({
						variables: {
							id
						}
					})
				}
			}
		}
	})
)(DefaultStatesList);