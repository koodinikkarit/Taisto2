import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import Settings from "../containers/Settings";

import EditDiagramScreen from "./EditDiagramScreen";
import CreateDiagramScreen from "./CreateDiagramScreen";

import RemoveDiagram from "../graphql/RemoveDiagram";

class DiagramSettings extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			addingScreen: false,
			newSlug: ""
		}
	}
	
	render() {
		if (this.props.diagram) {
			return (
				<Settings>
					<div className="row-fluid">
						<div className="col">
							<h1>Tunniste</h1>
							<button className="btn btn-danger"
							 onClick={e => {
								 this.props.removeDiagram({ 
									 id: this.props.diagram.id 
								 }).then(data => {
									 this.props.history.push("/Settings/diagrams");
								 })
							 }}>
								Poista
							</button>
							<input className="form-control" value={this.props.diagram.slug} />
						</div>
					</div>
					<div className="row-fluid">
						<div className="col">
							<h1>Kaavion näytöt</h1>
						</div>
						<div className="col">
							<button className="btn btn-success"
							 onClick={e => {
								 this.setState({
									 addingScreen: true
								 });
							 }}>
								Lisää näyttö
							</button>
						</div>
					</div>
					<div className="row-fluid">
						<div className="row-fluid">
							{this.state.addingScreen ?
							 <CreateDiagramScreen
							  diagram={this.props.diagram}
							  onDiagramScreenCreated={() => {
								this.setState({
									addingScreen: false
								});
							  }}
							  onDiagramScreenCreationCancelled={() => {
								this.setState({
									addingScreen: false
								});
							  }} />: ""}
						</div>
						<ul>
							{this.props.diagram.diagramScreens.map(diagramScreen => (
								<li key={diagramScreen.id} >
									<EditDiagramScreen id={diagramScreen.id} />
								</li>
							))}
						</ul>
					</div>
				</Settings>
			);
		} else {
			return (
				<h1>Ei olee</h1>
			);
		}
	}

}

export default compose(
	graphql(gql`
	query Diagram($slug: String!) {
		diagram: diagramBySlug(slug: $slug) {
			id
			slug
			diagramScreens { 
				id
				slug
			}
		}
	}`, {
		options: (ownProps) => {
			return {
				variables: {
					slug: ownProps.params.slug
				}
			}
		},
		props: ({ ownProps, data: { diagram } }) => ({
			diagram
		})
	}),
	RemoveDiagram
)(DiagramSettings);






/*
<div className="col">
								<h1>Tunniste</h1>
								<input type="text" className="form-control"
								 value={this.state.newSlug} onChange={e => {
							 		this.setState({
								 		newSlug: e.target.value
							 		});
						 		}} />
								<button className="btn btn-success"
								 onClick={e => {
									 this.props.createDiagramScreen({
										 slug: this.state.newSlug,
										 diagram: this.props.diagram.id
									 }).then(data => {
										 this.setState({
											 addingScreen: false
										 });
									 })
								 }}>
									Lisää
								</button>
								<button className="btn"
								 onClick={e => {
									 this.setState({
										 addingScreen: false,
										 newSlug: ""
									 });
								 }}>Peruuta</button>
							</div>*/