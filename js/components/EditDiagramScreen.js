import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

class EditDiagramScreen extends React.Component {
	constructor(props) {
		super(props);
		this.state = {

		}
	}

	render() {
		var conPorts = [];
		var cpuPorts = [];
		if (this.props.matrixs && this.props.diagramScreen) {
			var matrix = this.props.matrixs.find(p => this.props.diagramScreen.matrix && p.id === this.props.diagramScreen.matrix.id);
			if (matrix) {
				matrix.conPorts.forEach(conPort => conPorts.push(conPort));
				matrix.cpuPorts.forEach(cpuPort => cpuPorts.push(cpuPort));
			}

			return (
				<div>
					<div className="row">
						<div className="col">
							<label>Tunnise:</label>
							<input className="form-control"
								value={this.props.diagramScreen.slug} />
						</div>
					</div>
					<div className="row">
						<div className="col">
							<label>Matriisi:</label>
							<select value={this.props.diagramScreen.matrix ?
								this.props.diagramScreen.matrix.id : null}>
								<option></option>
								{this.props.matrixs.map(matrix => (
									<option>{matrix.slug}</option>
								))}
							</select>
						</div>
					</div>
					<div className="row">
						{matrix ?
							<div className="col">
								<label>Näyttö:</label>
								<select value={this.props.diagramScreen.conPort ?
									this.props.diagramScreen.conPort.id : null}>
									{conPorts.map(conPort => (
										<option value={conPort.id}>{conPort.slug}</option>
									))}
								</select>
							</div> : ""}
					</div>
				</div>
			)
		} else {
			return <h1>Ei olee</h1>
		}
	}
}

export default compose(
	graphql(gql`
	query Matrixs {
		matrixs: matrixs {
			id
			slug
			conPorts {
				id
				slug
			}
			cpuPorts {
				id
				slug
			}
		}
	}`, {
			props: ({ ownProps, data: { matrixs }}) => ({
				matrixs
			})
		}),
	graphql(gql`
	query DiagramScreen($id: String!) {
		diagramScreen: diagramScreenById(id: $id) {
			id
			slug
			matrix {
				id
			}
			conPort {
				id
			}
			cpuPorts {
				id
			}
		}
	}`, {
			options: (ownProps) => {
				return {
					variables: {
						id: ownProps.id
					}
				}
			},
			props: ({ ownProps, data: { diagramScreen } }) => ({
				diagramScreen
			})
		}),
	graphql(gql`
	mutation ($id: String!, $slug: String!, $conPort: String!, $matrix: String!) {
		diagramScreen: editDiagramScreen(id: $id, slug: $slug, conPort: $conPort, matrix: $matrix) {
			id,
			slug,
			conPort,
			matrix
		}
	}`, {
			props: ({ownProps, mutate}) => {
				return {
					editDiagramScreen({ id, slug, conPort, matrix }) {
						return mutate({
							variables: { id, slug, conPort, matrix },
							updateQueries: {
								DiagramScreen: (prev, { mutationResult }) => Object.assign({}, state, {
									diagramScreens: prev.diagram.diagramScreens.map(p => {
										if (p.id === mutationResult.data.diagramScreen.id) {
											return mutationResult.data.diagramScreen;
										}
										return p;
									})
								})
							}
						});
					}
				}
			}
		})
)(EditDiagramScreen);