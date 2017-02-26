import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';


class CreateDiagramScreen extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			slug: "",
			selectedMatrix: "",
			selectedConPort: ""
		}
	}

	render() {
		
		var conPorts;
		if (this.state.selectedMatrix) {
			var matrix = this.props.matrixs.find(p => p.id === this.state.selectedMatrix);
			if (matrix) {
				conPorts = matrix.conPorts;
			}
		}

		return (
			<div className="row-fluid">
				<div className="col">
					<h1>Tunniste</h1>
					<input className="form-control"
					value={this.state.slug}
					onChange={e => {
						this.setState({
							slug: e.target.value
						});
					}} />
					<select value={this.state.selectedMatrix}
					 className="form-control"
					 onChange={e => {
						 this.setState({
							 selectedMatrix: e.target.value
						 });
					 }}>
					 	<option></option>
						{this.props.matrixs ?
						 this.props.matrixs.map(matrix => (
							<option value={matrix.id}>{matrix.slug}</option>
						)) : ""}
					</select>
					{this.state.selectedMatrix ?
					<select value={this.props.selectedConPort}
					className="form-control"
					onChange={e => {
						this.setState({
							selectedConPort: e.target.value
						});
					}}>
						{conPorts ?
						 conPorts.map(conPort => (
							<option value={conPort.id}>{conPort.portNum + ". "}{conPort.slug}</option>
						 )) : ""}
					</select> : ""}
				</div>
				<button className="btn btn-success"
					onClick={e => {
						this.props.createDiagramScreen({
							slug: this.state.slug,
							conPort: this.state.selectedConPort,
							diagram: this.props.diagram.id
						}).then(data => {
							this.setState({
								slug: "",
								selectedConPort: "",
								selectedMatrix: ""
							});
							if (this.props.onDiagramScreenCreated)
							this.props.onDiagramScreenCreated();
						})
					}}>
					Lisää
				</button>
				<button className="btn"
					onClick={e => {
						this.setState({
							slug: "",
							selectedConPort: "",
							selectedMatrix: ""
						});
						if (this.props.onDiagramScreenCreationCancelled)
						this.props.onDiagramScreenCreationCancelled();
					}}>Peruuta</button>
			</div>
		)
	}
}

export default compose(
	graphql(gql`
	query matrixs{
		matrixs {
			id
			slug
			conPorts {
				id
				slug
				portNum
			}
		}
	}`, {
		props: ({ownProps, data: { matrixs }}) => ({
			matrixs
		})
	}),
	graphql(gql`
	mutation ($slug: String!, $diagram: String!) {
		diagramScreen : createDiagramScreen (slug: $slug, diagram: $diagram) {
			id
			slug
		}
	}`, {
		props: ({ownPorts, mutate}) => {
			return {
				createDiagramScreen({ slug, diagram }) {
					return mutate({
						variables: { slug, diagram },
						updateQueries: {
							Diagram: (prev, { mutationResult }) => {
								const newDiagramScreen = mutationResult.data.diagramScreen;
								return Object.assign({}, prev, {
									diagram: Object.assign({}, prev.diagram, {
										diagramScreens: [...prev.diagram.diagramScreens, mutationResult.data.diagramScreen]
									})
								});
							}
						}
					})
				}
			}
		}
	})
)(CreateDiagramScreen);