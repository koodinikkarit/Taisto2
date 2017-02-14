import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';


class CreateDiagramScreen extends React.Component {
	contructor(props) {
		super(props);
		this.state = {

		}
	}

	render() {
		return (
			<div className="row-fluid">
				<div className="col">
					<h1>Tunniste</h1>
					<input className="form-control" />
					<select>
					</select>
				</div>
			</div>
		)
	}
}

export default compose(
	graphql(gql`
	query {
		
	}
	`)
)