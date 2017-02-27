import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

class EditDiagramScreen extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			addingNewCpu: false,
			selectedCpuPort: ""
		}
	}

	componentWillMount() {
		if (this.props.diagramScreen) {
			this.setState({
				selectedCpuPort: this.props.diagramScreen.matrix.cpuPorts[0].id
			});
		}
	}

	render() {
		var conPorts = [];
		var cpuPorts = [];

		if (this.props.diagramScreen) {
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
							<label>Matriisi: {this.props.diagramScreen.matrix.slug}</label>
						</div>
					</div>
					<div className="row">		
						<div className="col">
							<label>Näyttö:</label>
							<select className="form-control"
								value={this.props.diagramScreen.conPort ?
								this.props.diagramScreen.conPort.id : null}>
								{this.props.diagramScreen.matrix.conPorts.map(conPort => (
									<option value={conPort.id}>{`${conPort.portNum}. ${conPort.slug}`}</option>
								))}
							</select>
						</div>
					</div>
					<div className="row">
						<div className="col">
							<label>Laitteet</label>
							<table className="table table-bordered">
  								<thead>
								  	<tr>
									  <td>
									  	<button className="btn btn-success"
										  onClick={e => {
											  this.setState({
												  addingNewCpu: true
											  });
										  }}>
										  Lisää laite
										</button>
										<br/>
										{this.state.addingNewCpu ?
										<div>
										<select className="form-control" value={this.state.selectedCpuPort}
										 onChange={e => {
											 this.setState({
												 selectedCpuPort: e.target.value
											 });
										 }}>
										{this.props.diagramScreen.matrix.cpuPorts.map(cpuPort => (
											<option value={cpuPort.id}>{`${cpuPort.portNum}. ${cpuPort.slug}`}</option>
										))}
										</select>
										<br/>
										<button className="btn"
										 onClick={e => {
											 this.setState({
												 addingNewCpu: false,
												 selectedCpuPort: false
											 });
										 }}>
											Peruuta
										</button>
										<button className="btn btn-success"
										 onClick={e => {
											 this.props.addCpuToDiagramScreen({
												 id: this.props.diagramScreen.id,
												 cpuPort: this.state.selectedCpuPort ? this.state.selectedCpuPort : this.props.diagramScreen.matrix.cpuPorts[0].id
											 }).then(data => {
												this.setState({
												 addingNewCpu: false,
												 selectedCpuPort: false
											 	});
											 });
										 }}>
											Lisaa
										</button>
										</div> : ""}
									  </td>
									</tr>
    								<tr>
      									<th>#</th>
      									<th>Nimi</th>
      									<th>Poista</th>
    								</tr>
  								</thead>
  								<tbody>
								  {this.props.diagramScreen.cpuPorts.map(cpuPort => (
									<tr>
										<td>{cpuPort.portNum}</td>
										<td>{cpuPort.slug}</td>
										<td>
											<button className="btn btn-danger"
											 onClick={e => {
												this.props.removeCpuFromDiagramScreen({
													id: this.props.diagramScreen.id,
													cpuPort: cpuPort.id
												}).then(data => {

												});
											 }}>Poista</button>
											</td>
									</tr>	  
								  ))}
								</tbody>
							</table>
						</div>
					</div>
					<hr />
					<button className="btn btn-danger"
					 onClick={e => {
						 this.props.removeDiagramScreen({
							 id: this.props.diagramScreen.id
						 });
					 }}>
						Poista
					</button>
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
	query diagramScreen($id: String!) {
		diagramScreen: diagramScreenById(id: $id) {
			id
			slug
			matrix {
				id
				slug
				conPorts {
					id
					slug
					portNum
				}
				cpuPorts {
					id
					slug
					portNum
				}
			}
			conPort {
				id
			}
			cpuPorts {
				id
				slug
				portNum
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
								diagramScreen: (prev, { mutationResult }) => Object.assign({}, state, {
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
		}),
	graphql(gql`
	mutation ($id: String!, $cpuPort: String!) {
		diagramScreen: addCpuToDiagramScreen(id: $id, cpuPort: $cpuPort) {
			id
			cpuPort {
				id
				slug
				portNum
			}
		}
	}`, {
		props: ({ ownProps, mutate }) => {
			return {
				addCpuToDiagramScreen({ id, cpuPort }) {
					return mutate({
						variables: {
							id,
							cpuPort
						},
						updateQueries: {
							diagramScreen: (prev, { mutationResult }) => {
								if (prev.diagramScreen.id === id) {
									return Object.assign({}, prev, {
										diagramScreen: Object.assign({}, prev.diagramScreen, {
											cpuPorts: [...prev.diagramScreen.cpuPorts, mutationResult.data.diagramScreen.cpuPort]
										})
									});
								}
							}
						}
					})
				}
			}
		}
	}),
	graphql(gql`
	mutation ($id: String!, $cpuPort: String!) {
		removeCpuFromDiagramScreen(id: $id, cpuPort: $cpuPort)
	}`, {
		props: ({ ownProps, mutate }) => {
			return {
				removeCpuFromDiagramScreen({ id, cpuPort }) {
					return mutate({
						variables: {
							id,
							cpuPort
						},
						updateQueries: {
							diagramScreen: (prev, { mutationResult }) => {
								return Object.assign({}, prev, {
									diagramScreen: Object.assign({}, prev.diagramScreen, {
										cpuPorts: prev.diagramScreen.cpuPorts.filter(p => p.id !== cpuPort)
									})
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
		removeDiagramScreen(id: $id)
	}`, {
		props: ({ ownProps, mutate }) => {
			return {
				removeDiagramScreen({ id }) {
					return mutate({
						variables: {
							id
						},
						updateQueries: {
							diagram: (prev, { mutationResult }) => {
								return Object.assign({}, prev, {
									diagram: Object.assign({}, prev.diagram, {
										diagramScreens: prev.diagram.diagramScreens.filter(p => p.id !== id)
									})									
								});
							}
						}
					})
				}
			}
		}
	})
)(EditDiagramScreen);






// <select value={this.props.diagramScreen.matrix ?
// 								this.props.diagramScreen.matrix.id : null}>
// 								<option></option>
// 								{this.props.matrixs.map(matrix => (
// 									<option>{matrix.slug}</option>
// 								))}
// 							</select>