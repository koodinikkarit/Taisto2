import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

class CreateDiagram extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			slug: ""
		};
	}

	render() {
		return (
			<div>
				<div className="row">
					<div className="col">
						<h2>Tunniste</h2>
					</div>
				</div>
				<div className="row">
					<div className="col-8">
						<input type="text" className="form-control"
						 value={this.state.slug} onChange={e => {
							 this.setState({
								 slug: e.target.value
							 });
						 }} />
					</div>
					<div className="col-4">
						<button className="btn btn-success"
						 onClick={e => {
							 this.props.createDiagram({
								 slug: this.state.slug
							 }).then(data => {
								 if (this.props.onDiagramCreated) {
									 this.props.onDiagramCreated();
								 }
							 })
						 }}>
							Luo
						</button>
					</div>
				</div>
			</div>
		)
	}
}

export default graphql(gql`
mutation createDiagram($slug: String!)  {
	diagram: createDiagram (slug: $slug) {
		id
		slug
	}
}`, {
	props: ({ownPorts, mutate }) => {
		return {
			createDiagram({ slug }) {
				return mutate({
					variables: { slug },
					updateQueries: {
						Diagrams: (prev, { mutationResult}) => {
							const newDiagram = mutationResult.data.diagram;
							return Object.assign({}, prev, {
								diagrams: [...prev.diagrams, newDiagram]
							});
						}
					}
				})
			}
		}
	}
})(CreateDiagram);