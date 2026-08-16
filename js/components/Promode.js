import React from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { graphql } from '@apollo/client/react/hoc';
import { compose } from 'redux';
import gql from 'graphql-tag';

import MatrixTable from "./MatrixTable";
import MatrixBoard from "./MatrixBoard";

import * as actions from "../actions/Promode";
import { AuthContext } from "./ProtectedApp";


class Promode extends React.Component {
	static contextType = AuthContext;
	changeMatrix(slug) {
		this.props.history.push(`/promode/${slug}/matriisi`);
	}

	renderContent() {

	}

	render() {
		const params = this.props.match ? this.props.match.params : {};
		var slug = null;
		var selectedMatrix = null;
		var mode = null;
		if (params.slug) {
			if (this.props.matrixs) {
				this.props.matrixs.some(matrix => {
					if (matrix.slug === params.slug) {
						slug = params.slug;
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

		if (params.mode) {
			mode = params.mode;
		} else {
			if (slug) {
				mode = "matriisi";
			}
		}

		const styles = {
			page: { maxWidth: "1280px", margin: "0 auto", padding: "18px 0 48px" },
			header: { display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "end", flexWrap: "wrap", marginBottom: "20px" },
			controls: { border: "1px solid #dfe5eb", borderRadius: "12px", padding: "14px", background: "#fff", boxShadow: "0 3px 12px rgba(24,39,75,.06)", marginBottom: "20px" },
			tabs: { display: "flex", gap: "8px", flexWrap: "wrap" },
			tab: { display: "inline-block", padding: "9px 14px", borderRadius: "7px", textDecoration: "none", fontWeight: 600 },
			activeTab: { background: "#1668b8", color: "white" },
			inactiveTab: { background: "#eef3f7", color: "#40566b" },
			label: { display: "block", color: "#64748b", fontSize: "12px", fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: "6px" }
		};

		if (slug && mode) {
			return (
				<div style={styles.page}>
					<div style={styles.header}>
						<div><h1 style={{ marginBottom: "5px" }}>Promode</h1><p style={{ margin: 0, color: "#64748b" }}>Reaaliaikainen matriisin kytkentöjen hallinta.</p></div>
						<div style={{ minWidth: "240px" }}><label style={styles.label}>Matriisi</label><select className="form-control" onChange={(e) => this.changeMatrix(e.target.value)} value={slug}>
								{this.props.matrixs ? this.props.matrixs.map(matrix => (
									<option key={matrix.id} value={matrix.slug}>{matrix.slug}</option>
								)) : ""}
							</select></div>
					</div>
					<div style={styles.controls}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
							<div style={styles.tabs}>
								<a style={{ ...styles.tab, ...(mode === "matriisi" ? styles.activeTab : styles.inactiveTab) }} href={`/promode/${slug}/matriisi`}>Matriisi</a>
								<a style={{ ...styles.tab, ...(mode === "valikko" ? styles.activeTab : styles.inactiveTab) }} href={`/promode/${slug}/valikko`}>Pikavalinta</a>
							</div>
							<button className="btn btn-outline-primary" onClick={() => selectedMatrix && this.props.requestAllStates(selectedMatrix.id)}>Päivitä tilanne</button>
						</div>
					</div>
					<div style={{ background: "#fff", border: "1px solid #dfe5eb", borderRadius: "12px", padding: "18px", boxShadow: "0 3px 12px rgba(24,39,75,.05)" }}>
						{mode === "matriisi" ?
						<MatrixTable conPorts={selectedMatrix.conPorts} cpuPorts={selectedMatrix.cpuPorts}
						videoConnections={this.props.videoConnections} kwmConnections={this.props.kwmConnections}
						onNewVideoConnection={(conId, cpuId) => this.props.setVideoConnection(conId, cpuId)}
						onNewKwmConnection={(conId, cpuId) => this.props.setKwmConnection(conId, cpuId)}
						onTurnOffVideoConnection={con => this.props.turnOffVideoConnection(con)}
						onTurnOffKwmConnection={cpu => this.props.turnOffKwmConnection(cpu)} />	:
						<MatrixBoard  conPorts={selectedMatrix.conPorts} cpuPorts={selectedMatrix.cpuPorts}
						 videoConnections={this.props.videoConnections} kwmConnections={this.props.kwmConnections}
						 onNewVideoConnection={(conId, cpuId) => this.props.setVideoConnection(conId, cpuId)}
						 onNewKwmConnection={(conId, cpuId) => this.props.setKwmConnection(conId, cpuId)} /> }
					</div>
				</div>
			);
		} else {
			const canManageSettings = !this.context.required || this.context.role === "admin";
			return <div style={{ maxWidth: "680px", margin: "48px auto", padding: "28px", textAlign: "center", background: "#fff", border: "1px solid #dfe5eb", borderRadius: "12px" }}><h1>Ei matriiseja</h1><p>{canManageSettings ? "Yhdistä ensin matriisi asetuksista, jotta voit käyttää Promodea." : "Admin ei ole vielä yhdistänyt matriisia."}</p>{canManageSettings && <a className="btn btn-primary" href="/settings/matriisit">Avaa asetukset</a>}</div>
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
