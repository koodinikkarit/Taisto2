import React from 'react';
import { graphql } from '@apollo/client/react/hoc';
import { compose } from 'redux';
import gql from 'graphql-tag';
import { I18nContext } from "../i18n";

class DefaultStatesList extends React.Component {
	static contextType = I18nContext;

	constructor(props) {
		super(props);
		this.state = { cooldowns: {} };
		this.cooldowns = {};
		this.cooldownTimers = [];
	}

	componentWillUnmount() {
		this.cooldownTimers.forEach(clearTimeout);
	}

	execute(defaultState) {
		if (this.cooldowns[defaultState.id]) return;
		this.cooldowns = { ...this.cooldowns, [defaultState.id]: true };
		this.setState({ cooldowns: this.cooldowns });
		this.cooldownTimers.push(setTimeout(() => {
			const nextCooldowns = { ...this.cooldowns };
			delete nextCooldowns[defaultState.id];
			this.cooldowns = nextCooldowns;
			this.setState({ cooldowns: nextCooldowns });
		}, 2000));
		this.props.executeDefaultState({ id: defaultState.id });
	}

	render() {
		const { t } = this.context;
		return (
			<div className="row">
				<div className="col">
					<div className="jumbotron">
						<h1>{t("defaults")}</h1>
					</div>
					<ul className="list-group">
					{this.props.defaultStates ? 
					 this.props.defaultStates.map(defaultState => (
						 <li className="list-group-item" key={defaultState.id}>
						 	<div className="row" style={{ width: "100%" }}>
							 	<div className="col" style={{ fontSize: "25px" }}>
								 	{defaultState.slug}
								</div>
								<div className="col">
									<button className="btn btn-info" disabled={Boolean(this.state.cooldowns[defaultState.id])}
									 onClick={() => this.execute(defaultState)}>
										{this.state.cooldowns[defaultState.id] ? t("wait") : t("execute")}
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
