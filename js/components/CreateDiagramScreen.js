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
		var selectedMatrix = this.state.selectedMatrix ? this.state.selectedMatrix : this.props.matrixs && this.props.matrixs.length > 0 ? this.props.matrixs[0].id : null;
		var conPorts;
		if (selectedMatrix) {
			var matrix = this.props.matrixs.find(p => p.id === selectedMatrix);
			if (matrix) {
				conPorts = matrix.conPorts;
			}
		}
		
		
		var selectedConPort = this.state.selectedConPort ? this.state.selectedConPort : conPorts && conPorts.length > 0 ? conPorts[0].id : null;

		return (
			<div className="row-fluid">
				<div className="col">
					<label>Tunniste</label>
					<input className="form-control"
					value={this.state.slug}
					onChange={e => {
						this.setState({
							slug: e.target.value
						});
					}} />
					<br />
					<label>Matriisi</label>
					<select value={selectedMatrix}
					 className="form-control"
					 onChange={e => {
						 this.setState({
							 selectedMatrix: e.target.value
						 });
					 }}>
						{this.props.matrixs ?
						 this.props.matrixs.map(matrix => (
							<option value={matrix.id}>{matrix.slug}</option>
						)) : ""}
					</select>
					<br />
					{selectedMatrix ?
					<div>
						<label>Näyttölaite</label>
						<select value={selectedConPort}
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
						</select>
					</div> : ""}
				</div>
				<br/>
				<div className="row">
					<div className="col">
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
						<button className="btn btn-success"
							onClick={e => {
								this.props.createDiagramScreen({
									slug: this.state.slug,
									conPort: selectedConPort,
									matrix: selectedMatrix,
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
					</div>
				</div>
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
	mutation ($slug: String!, $diagram: String!, $matrix: String!, $conPort: String!) {
		diagramScreen : createDiagramScreen (slug: $slug, diagram: $diagram, matrix: $matrix, conPort: $conPort) {
			id
			slug
		}
	}`, {
		props: ({ownPorts, mutate}) => {
			return {
				createDiagramScreen({ slug, diagram, conPort, matrix }) {
					return mutate({
						variables: { slug, diagram, conPort, matrix },
						updateQueries: {
							diagram: (prev, { mutationResult }) => {
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