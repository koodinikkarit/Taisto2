import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

class DefaultStateSelect extends React.Component {
	constructor(props) {
		super(props);
		this.state = {

		}
	}

	render() {
		if (this.props.defaultStates && !this.props.selectedDefaultState && 
			this.props.defaultStates.length > 0 && this.props.onIdChanged) {
			this.props.onIdChanged(this.props.defaultStates[0].id);
		}

		return (
			<select className="form-control" value={this.props.selectedDefaultState}
			 onChange={e => {
				 if (this.props.onIdChanged) this.props.onIdChanged(e.target.value)
			 }}>
			 {!this.props.selectedDefaultState ? <option></option> : ""}
			 {this.props.defaultStates ? this.props.defaultStates.map(defaultState => (
				 <option value={defaultState.id}>{defaultState.slug}</option>
			 )) : ""}
			</select>
		)
	}
}

export default compose(
	graphql(gql`
	query {
		defaultStates {
			id
			slug
		}
	}`, {
		props: ({ ownProps, data: { defaultStates }}) => ({
			defaultStates
		})
	} )
)(DefaultStateSelect);