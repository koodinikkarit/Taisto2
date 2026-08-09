import React from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { graphql } from '@apollo/client/react/hoc';
import { compose } from 'redux';
import gql from 'graphql-tag';

import * as actions from "../actions/ActionShortcut";

class ActionShortcut extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    render() {
        if (this.props.diagramScreen) {
            var activeDevice = this.props.diagramScreen.matrix.cpuPorts.find(p => p.id === this.props.videoConnections[this.props.diagramScreen.conPort.id]);
            const styles = {
                card: { border: "1px solid #dfe5eb", borderRadius: "12px", background: "#fff", boxShadow: "0 3px 12px rgba(24,39,75,.06)", overflow: "hidden" },
                header: { padding: "16px 18px", background: "linear-gradient(135deg,#edf6ff,#f8fbfe)", borderBottom: "1px solid #dfe5eb" },
                body: { padding: "18px" },
                caption: { color: "#64748b", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "4px" },
                value: { color: "#172b3a", fontSize: "19px", fontWeight: 650 },
                select: { marginTop: "8px", width: "100%" }
            };
            return (
                <article style={styles.card}>
                    <header style={styles.header}>
                        <div style={styles.caption}>Näyttölaite</div>
                        <div style={styles.value}>{this.props.diagramScreen.conPort.slug || this.props.diagramScreen.slug}</div>
                    </header>
                    <div style={styles.body}>
                        <div style={styles.caption}>Aktiivinen laite</div>
                        <div style={{ ...styles.value, minHeight: "28px" }}>{activeDevice ? `${activeDevice.portNum}. ${activeDevice.slug}` : "Ei valittua lähdettä"}</div>
                        <label style={{ ...styles.caption, display: "block", marginTop: "20px" }}>Vaihda laite</label>
                        <select className="form-control"
                            style={styles.select}
                            value={activeDevice ? activeDevice.id : ""}
                            onChange={e => this.props.setVideoConnection(this.props.diagramScreen.conPort.id, e.target.value)}>
                            <option></option>
                            {this.props.diagramScreen.cpuPorts.map(cpuPort => (
                                <option key={cpuPort.id} value={cpuPort.id}>{`${cpuPort.portNum}. ${cpuPort.slug}`}</option>
                            ))}
                        </select>
                    </div>
                </article>
            );
        } else {
            return <div className="alert alert-secondary">Näytön tietoja ladataan…</div>
        }
    }
}

export default compose(
    graphql(gql`
    query ($id: String!) {
        diagramScreen: diagramScreenById(id: $id) {
            id 
            slug
            matrix {
                cpuPorts {
                    id
                    slug
                    portNum
                }
            }
            conPort {
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
        options: (ownProps) => ({
            variables: {
                id: ownProps.diagramScreenId
            }
        }),
        props: ({ ownProps, data: { diagramScreen }}) => ({
            diagramScreen
        })
    }),
    connect(
        state => ({
            videoConnections: state.matrix && state.matrix.videoConnections ? state.matrix.videoConnections.toJS() : { },
        }),
        dispatch => bindActionCreators(actions, dispatch))
)(ActionShortcut)
