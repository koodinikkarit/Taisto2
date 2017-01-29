import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

class ConnectingMatrix extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			slug: "",
			ip: "",
			port: 1234,
			conPortAmount: 1,
			cpuPortAmount: 1
		};
	}

	render() {
		return (
			<div style={{ marginBottom: "20px" }}>
				<div className="row">
					<div className="col">
						<h2>Tunniste</h2>
						<input type="text" className="form-control"
						 onChange={e => {
							 this.setState({ slug: e.target.value });
						 }} value={this.state.slug} />
					</div>
				</div>
				<div className="row">
					<div className="col-8">
						Ip
						<div>
							<input type="text" className="form-control"
							 onChange={e => {
								 this.setState({ ip: e.target.value });
							 }} value={this.state.ip} />
						</div>
					</div>
					<div className="col-4">
						Port
						<div>
							<input type="number" className="form-control"
							 onChange={e => {
								 this.setState({ port: e.target.value });
							 }} value={this.state.port} />
						</div>
					</div>
				</div>
				<div className="row">
					<div className="col-6">
						Con porttien määrä
						<div>
							<input type="number" className="form-control"
							 onChange={e => {
								 this.setState({ conPortAmount: e.target.value });
							 }} value={this.state.conPortAmount} />
						</div>
					</div>
					<div className="col-6">
						Cpu porttien määrä
						<div>
							<input type="number" className="form-control"
							 onChange={e => {
								 this.setState({ cpuPortAmount: e.target.value });
							 }} value={this.state.cpuPortAmount} />
						</div>
					</div>
				</div>
				<div className="row">
					<div className="col" style={{ marginTop: "20px" }}>
						<button className="btn btn-success"
						 onClick={e => {
							 this.props.connectMatrix({
								 variables: {
									slug: this.state.slug,
									ip: this.state.ip,
									port: this.state.port,
									conPortAmount: this.state.conPortAmount,
									cpuPortAmount: this.state.cpuPortAmount
								 }
							 }).then(matrix => {
								 
							 });
						 }}>Yhdistä</button>
					</div>
				</div>
			</div>
		)
	}
}

export default compose(
	graphql(gql`
	mutation ($slug: String!, $ip: String!, $port: Int!, $conPortAmount: Int!, $cpuPortAmount: Int!) { 
		connectNewMatrix(slug: $slug, ip: $ip, port: $port, conPortAmount: $conPortAmount, cpuPortAmount: $cpuPortAmount) {
			id
			slug
		}
	}`, {
		name: "connectMatrix"
	})
)(ConnectingMatrix);