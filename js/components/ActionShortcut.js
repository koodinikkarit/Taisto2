import React from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { graphql, compose } from 'react-apollo';
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
            return (
                <div className="row-fluid" style={{ width: "100%" }}>
                    <div className="col">
                        <div className="row">
                            <div className="col" style={{ textAlign: "right", fontSize: "25px" }}>
                                Näyttölaite:
                        </div>
                            <div className="col" style={{ fontSize: "25px" }}>
                                {this.props.diagramScreen.conPort.slug}
                            </div>
                        </div>
                        <div className="row">
                            <div className="col" style={{ textAlign: "right", fontSize: "25px" }}>
                                Aktiivinen laite:
                        </div>
                            <div className="col" style={{ fontSize: "25px" }}>
                                {activeDevice ? `${activeDevice.portNum}. ${activeDevice.slug}` : ""}
                            </div>
                        </div>
                        <div className="row">
                            <div className="col" style={{ textAlign: "right", fontSize: "25px" }}>
                                Vaihda laite:
                        </div>
                            <div className="col">
                                <select className="form-control"
                                    value={activeDevice ? activeDevice.id : ""}
                                    onChange={e => {
                                        this.props.setVideoConnection(this.props.diagramScreen.conPort.id, e.target.value);
                                    }}>
                                    <option></option>
                                    {this.props.diagramScreen.cpuPorts.map((cpuPort, index) => {
                                        return (<option value={cpuPort.id}>{`${cpuPort.portNum}. ${cpuPort.slug}`}</option>);
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return <h1>hoii</h1>
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