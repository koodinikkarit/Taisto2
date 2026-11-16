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
            const displayDevice = this.props.diagramScreen.conPort;
            const displayDeviceName = displayDevice.slug || this.props.diagramScreen.slug;
            const displayDeviceLabel = displayDevice.portNum !== null && displayDevice.portNum !== undefined
                ? `${displayDevice.portNum}. ${displayDeviceName}`
                : displayDeviceName;
            const inputId = `diagram-device-${this.props.diagramScreen.id}`;
            return (
                <article className="taisto-diagram-card">
                    <header className="taisto-diagram-card-header">
                        <div className="taisto-diagram-card-eyebrow">Näyttölaite</div>
                        <h2 className="taisto-diagram-card-title">{displayDeviceLabel}</h2>
                    </header>
                    <div className="taisto-diagram-card-body">
                        <div className="taisto-diagram-card-eyebrow">Aktiivinen laite</div>
                        <div className="taisto-diagram-card-current">{activeDevice ? `${activeDevice.portNum}. ${activeDevice.slug}` : "Ei valittua lähdettä"}</div>
                        <div className="taisto-diagram-card-field">
                        <label htmlFor={inputId}>Vaihda laite</label>
                        <select id={inputId} className="form-control"
                            value={activeDevice ? activeDevice.id : ""}
                            onChange={e => this.props.setVideoConnection(this.props.diagramScreen.conPort.id, e.target.value)}>
                            <option></option>
                            {this.props.diagramScreen.cpuPorts.map(cpuPort => (
                                <option key={cpuPort.id} value={cpuPort.id}>{`${cpuPort.portNum}. ${cpuPort.slug}`}</option>
                            ))}
                        </select>
                        </div>
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
