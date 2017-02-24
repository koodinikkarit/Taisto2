import React from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import MatrixTable from "./MatrixTable";
import MatrixBoard from "./MatrixBoard";

import * as actions from "../actions/Promode";


class Promode extends React.Component {
	changeMatrix(slug) {
		this.props.history.push(`/promode/${slug}/matriisi`);
	}

	renderContent() {

	}

	render() {
		console.log("props", this.props);
		var slug = null;
		var selectedMatrix = null;
		var mode = null;
		if (this.props.params.slug) {
			if (this.props.matrixs) {
				this.props.matrixs.some(matrix => {
					if (matrix.slug === this.props.params.slug) {
						slug = this.props.params.slug;
						selectedMatrix = matrix;
					}
				});				
			}
		} else {
			if (this.props.matrixs && this.props.matrixs.length > 0) {
				slug = this.props.matrixs[0].slug;
				selectedMatrix = this.props.matrixs[0];
			}
		}

		if (this.props.params.mode) {
			mode = this.props.params.mode;
		} else {
			if (slug) {
				mode = "matriisi";
			}
		}

		if (slug && mode) {
			console.log("mode on", mode);
			return (
				<div>
					<div className="row">
						<div className="col-4">
							<ul className="nav justify-content-center">
								<li className="nav-link">
									<a className="nav-link" href={`/promode/${slug}/matriisi`}>
										Matriisi
								</a>
								</li>
								<li className="nav-link">
									<a className="nav-link" href={`/promode/${slug}/valikko`}>
										Valikko
								</a>
								</li>
							</ul>
						</div>
						<div className="col-4">
							<button className="btn btn-info"
							 onClick={() => {
								 if (selectedMatrix)
								 this.props.requestAllStates(selectedMatrix.id);
							 }}>
								Päivitä
							</button>
						</div>
						<div className="col-4">
							<select className="form-control" onChange={(e) => this.changeMatrix(e.target.value)} value={slug}>
								{this.props.matrixs ? this.props.matrixs.map(matrix => (
									<option key={matrix.id} value={matrix.slug}>{matrix.slug}</option>
								)) : ""}
							</select>
						</div>
					</div>
					<div className="row">
						{mode === "matriisi" ?
						<MatrixTable conPorts={selectedMatrix.conPorts} cpuPorts={selectedMatrix.cpuPorts}
						videoConnections={this.props.videoConnections} kwmConnections={this.props.kwmConnections}
						onNewVideoConnection={(conId, cpuId) => this.props.setVideoConnection(conId, cpuId)}
						onNewKwmConnection={(conId, cpuId) => this.props.setKwmConnection(conId, cpuId)}
						onTurnOffVideoConnection={con => this.props.turnOffVideoConnection(con)}
						onTurnOffKwmConnection={cpu => this.props.turnOffKwmConnection(cpu)} />	:
						<MatrixBoard  conPorts={selectedMatrix.conPorts} cpuPorts={selectedMatrix.cpuPorts}
						 videoConnections={this.props.videoConnections} kwmConnections={this.props.kwmConnections}
						 onNewVideoConnection={(conId, cpuId) => this.props.setVideoConnection(conId, cpuId)} /> }		
					</div>
				</div>
			);
		} else {
			return <h1>Et ole vielä yhdistänyt yhtäkään matriisia.</h1>
		}
	}
}

export default compose(
	graphql(gql`
	query {
    	matrixs {
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
	}`, {
        props: ({ ownProps, data: { matrixs }}) => ({
            matrixs
       })
	}),
	connect(
    store => {
        return {
            videoConnections: store.matrix && store.matrix.videoConnections ? store.matrix.videoConnections.toJS() : { },
            kwmConnections: store.matrix && store.matrix.kwmConnections ? store.matrix.kwmConnections.toJS() : { }
        }
    },
    dispatch => bindActionCreators(actions, dispatch))
)(Promode);