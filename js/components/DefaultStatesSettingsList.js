import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import Settings from "../containers/Settings";

class DefaultStatesSettingsList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			creatingDefaultStates: false
		};
	}

	render() {
		return (
			<Settings active="oletustilat">
				<div className="row">
					<div className="col">
						<h1>Oletustilat</h1>
					</div>
					<div className="col">
						<button className="btn btn-success"
						 onClick={e => {
							 this.setState({
								 creatingDefaultStates: true
							 });
						 }}>
							Uudet oletustilat
						</button>
					</div>
				</div>
				<hr/>
				<br/>
				{this.state.creatingDefaultStates ? 
				<div className="row">
					<div className="col-xl-4">
						<div className="row">
							<div className="col-xl-4" style={{ fontSize: "20px" }}>
								Tunniste:
							</div>
							<div className="col-xl-8">
								<input className="form-control" />
							</div>
						</div>
						<br />
						<div className="row">
							<div className="col">
								<button className="btn"
								 onClick={e => {
									 this.setState({
										 creatingDefaultStates: false
									 });
								 }}>
									Peruuta
								</button>
							</div>
							<div className="col">
								<button className="btn btn-success">
									Luo
								</button>
							</div>
						</div>
					</div>
					<div className="col-xl-8">
					</div>
				</div> : ""}
				<br/>
			<div>
				MOi
			</div>
			</Settings>
		);
	}
}

export default DefaultStatesSettingsList;