import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import Settings from "../containers/Settings";
import CreateDiagram from "./CreateDiagram";

class DiagramList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			creatingDiagram: false
		};
	}

	render() {
		return (
			<Settings active="diagrams">
				<div className="row">
					<div className="col-6">
						<h1>Kaaviolista</h1>
					</div>
					<div className="col-4">
						<button className="btn btn-success"
						onClick={e => {
							this.setState({ 
								creatingDiagram: true 
							});
						}}>Luo uusi kaavio.</button>
					</div>
				</div>
				{this.state.creatingDiagram ?
				<CreateDiagram onDiagramCreated={e => {
					this.setState({ creatingDiagram: false });
				}} /> : ""}
				<ul className="list-group">
					{this.props.diagrams ?
					 this.props.diagrams.map(diagram => (
						 <li key={diagram.id} className="list-group-item list-group-item-action"
						  onClick={() => this.props.history.push(`/settings/diagram/${diagram.slug}`)}>
						  	{diagram.slug}
						  </li>
					 )) : ""}
				</ul>
			</Settings>
		)
	}
}



export default graphql(gql`
query Diagrams{
	diagrams {
		id
		slug
	}
}`, {
	props: ({ ownProps, data: { diagrams } }) => ({
		diagrams
	})
})(DiagramList);