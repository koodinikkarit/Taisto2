import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import Settings from "../containers/Settings";
import MatrixTable from "./MatrixTable";

import Accordion from "./Accordion";
import AccordionCard from "./AccordionCard";

class DefaultStateSettings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            videoConnections: {},
            kwmConnections: {}
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.defaultState) {
            nextProps.defaultState.videoConnections.forEach(videoConnection => {
                this.state.videoConnections[videoConnection.conPort.id] = videoConnection.cpuPort.id;
            });
            nextProps.defaultState.kwmConnections.forEach(kwmConnection => {
                this.state.kwmConnections[kwmConnection.cpuPort.id] = kwmConnection.conPort.id;
            });
            this.forceUpdate();
        }
    }
    
    render() {
        if (this.props.defaultState) {
        return (
			<Settings>
				<Accordion>
					<AccordionCard header="Tiedot">
						<div className="row">
							<div className="col-xl-6">
								<div className="row">
									<div className="col" style={{ textAlign: "right", fontSize: "25px" }}>
										Tunniste:
                        			</div>
									<div className="col" style={{ fontSize: "25px" }}>
										{this.props.defaultState.slug}
									</div>
								</div>
								<div className="row">
									<div className="col" style={{ textAlign: "right", fontSize: "25px" }}>
										Matriisi:
                        			</div>
									<div className="col" style={{ fontSize: "25px" }}>
										{this.props.defaultState.matrix.slug}
									</div>
								</div>
							</div>
							<div className="col-xl-6">
							</div>
						</div>
					</AccordionCard>
					<AccordionCard header="Matriisi">
						<MatrixTable conPorts={this.props.defaultState.matrix.conPorts}
							cpuPorts={this.props.defaultState.matrix.cpuPorts}
							videoConnections={this.state.videoConnections}
							kwmConnections={this.state.kwmConnections}
							onNewVideoConnection={(conId, cpuId) => {
								this.props.insertVideoConnection({
									id: this.props.defaultState.id,
									conPort: conId,
									cpuPort: cpuId
								})
								this.state.videoConnections[conId] = cpuId;
								this.forceUpdate();
							}}
							onNewKwmConnection={(conId, cpuId) => {
								this.props.insertKwmConnection({
									id: this.props.defaultState.id,
									conPort: conId,
									cpuPort: cpuId
								})
								this.state.kwmConnections[cpuId] = conId;
								this.forceUpdate();
							}}
							onTurnOffVideoConnection={con => {
								this.props.removeVideoConnection({
									id: this.props.defaultState.id,
									conPort: con
								});
								this.state.videoConnections[con] = 0;
								this.forceUpdate();
							}}
							onTurnOffKwmConnection={cpu => {
								this.props.removeKwmConnection({
									id: this.props.defaultState.id,
									cpuPort: cpu
								});
								this.state.kwmConnections[cpu] = 0;
								this.forceUpdate();
							}} />
					</AccordionCard>
				</Accordion>
			</Settings>
        )
        } else {
            return <Settings> 
                <img src="/static/kappa.png" style={{
                    webkitAnimation: "spin 4s linear infinite",
                    mozAnimation: "spin 4s linear infinite",
                    animation: "spin 4s linear infinite"
                }}/>
            </Settings>
        }
    }
}


export default compose(
    graphql(gql`
    query defaultState($slug: String!) {
        defaultState: defaultStateBySlug(slug: $slug) {
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
            videoConnections {
                id
                conPort {
                    id
                }
                cpuPort {
                    id
                }
            }
            kwmConnections {
                id 
                conPort {
                    id
                }
                cpuPort {
                    id
                }
            }
        }
    }`, {
        options: (ownProps) => ({
            variables: {
                slug: ownProps.params.slug
            }
        }),
        props: ({ ownProps, data: { defaultState } }) => ({
            defaultState
        })
    }),
    graphql(gql`
    mutation ($id: String!, $conPort: String!, $cpuPort: String!) {
        insertVideoConnectionToDefaultState(id: $id, conPort: $conPort, cpuPort: $cpuPort) {
            id
        }
    }`, {
        props: ({ ownProps, mutate }) => {
            return {
                insertVideoConnection({ id, conPort, cpuPort }) {
                    return mutate({
                        variables: {
                            id, 
                            conPort,
                            cpuPort
                        }
                    })
                }
            }
        }
    }),
    graphql(gql`
    mutation ($id: String!, $conPort: String!, $cpuPort: String!) {
        insertKwmConnectionToDefaultState(id: $id, conPort: $conPort, cpuPort: $cpuPort) {
            id
        }
    }`, {
        props: ({ ownProps, mutate }) => {
            return {
                insertKwmConnection({ id, conPort, cpuPort }) {
                    return mutate({
                        variables: {
                            id, 
                            conPort,
                            cpuPort
                        }
                    })
                }
            }
        }
    }),
    graphql(gql`
    mutation ($id: String!, $conPort: String!) {
        removeVideoConnectionFromDefaultState(id: $id, conPort: $conPort)
    }`, {
        props: ({ ownProps, mutate }) => {
            return {
                removeVideoConnection({ id, conPort }) {
                    return mutate({
                        variables: {
                            id,
                            conPort
                        }
                    })
                }
            }
        }
    }),
    graphql(gql`
    mutation ($id: String!, $cpuPort: String!) {
        removeKwmConnectionFromDefaultState(id: $id, cpuPort: $cpuPort)
    }`, {
        props: ({ ownProps, mutate }) => {
            return {
                removeKwmConnection({ id, cpuPort }) {
                    return mutate({
                        variables: {
                            id,
                            cpuPort
                        }
                    })
                }
            }
        }
    })
)(DefaultStateSettings);