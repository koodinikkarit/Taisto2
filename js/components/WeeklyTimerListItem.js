import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import MatrixsSelect from "./MatrixsSelect";
import SelectPortConnection from "../containers/SelectPortConnection";
import Accordion from "../components/Accordion";
import AccordionCard from "../components/AccordionCard";
import DefaultStateSelect from "./DefaultStateSelect";

class WeeklyTimerListItem extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			creatingNewCommand: false,
			commandToBeExecuted: "defaultState",
			selectedMatrix: "",
			selectedConPort: "",
			selectedCpuPort: "",
			selectedDefaultState: "",
			minutes: 0,
			hours: 0,
			slug: ""
		}
	};

	componentWillReceiveProps(nextProps) {
		if (nextProps.weeklyTimer) {
			this.setState({
				minutes: nextProps.weeklyTimer.minutes,
				hours: nextProps.weeklyTimer.hours,
				slug: nextProps.weeklyTimer.slug
			});
		}
	}

	render() {
		var styles = {
			hourInput: {
				width: "80px"
			},
			minuteInput: {
				width: "80px"
			},
			commandsTable: {
				marginTop: "20px"
			},
			weekDayContainer: {
				marginTop: "4px",
				marginBottom: "4px"
			},
			weekdayCheckBox: {
				height: "1.3em",
				width: "1.3em",
				marginRight: "8px"
			},
		}
		
		if (!this.props.weeklyTimer) {
		return <h1>Ei mittaa</h1>
		} else {

		return (
			<div className="row">
				<div className="col-xl-4">
					<div className="row">
						<button className="btn btn-danger"
							onClick={e => {
								this.props.removeWeeklyTimer({
									id: this.props.weeklyTimer.id
								});
							}}>
							Poista ajastin
								</button>
					</div>
					<br />
					<div className="row">
						<div className="col" style={{ textAlign: "right", fontSize: "22px" }}>
							Tunniste:
						</div>
						<div className="col">
							<input className="form-control" value={this.state.slug}
							 onChange={e => this.setState({ slug: e.target.value })}
							 onBlur={e => {
								this.props.editWeeklyTimer({
									id: this.props.weeklyTimer.id,
									slug: e.target.value
								});
							 }}
							 onKeyPress={e => {
								 if (e.key === 'Enter') this.props.editWeeklyTimer({
									id: this.props.weeklyTimer.id,
									slug: e.target.value
								});
							 }} />
						</div>
					</div>
					<br />
					<div className="row" style={styles.weekDayContainer}>
						<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.monday}
							onChange={e => {
								this.setState({ monday: !this.state.monday })
								this.props.editWeeklyTimer({
									id: this.props.weeklyTimer.id,
									monday: !this.props.weeklyTimer.monday
								});
							}} /> Maanantai
							</div>
					<div className="row" style={styles.weekDayContainer}>
						<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.tuesday}
							onChange={e => {
								this.setState({ tuesday: !this.state.tuesday })
								this.props.editWeeklyTimer({
									id: this.props.weeklyTimer.id,
									tuesday: !this.props.weeklyTimer.tuesday
								});
							}} /> Tiistai <br />
					</div>
					<div className="row" style={styles.weekDayContainer}>
						<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.wednesday}
							onChange={e => {
								this.setState({ wednesday: !this.state.wednesday })
								this.props.editWeeklyTimer({
									id: this.props.weeklyTimer.id,
									wednesday: !this.props.weeklyTimer.wednesday
								});
							}} /> Keskiviikko <br />
					</div>
					<div className="row" style={styles.weekDayContainer}>
						<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.thursday}
							onChange={e => {
								this.setState({ thursday: !this.state.thursday })
								this.props.editWeeklyTimer({
									id: this.props.weeklyTimer.id,
									thursday: !this.props.weeklyTimer.thursday
								});
							}} /> Torstai <br />
					</div>
					<div className="row" style={styles.weekDayContainer}>
						<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.friday}
							onChange={e => {
								this.setState({ friday: !this.state.friday })
								this.props.editWeeklyTimer({
									id: this.props.weeklyTimer.id,
									friday: !this.props.weeklyTimer.friday
								});
							}} /> Perjantai <br />
					</div>
					<div className="row" style={styles.weekDayContainer}>
						<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.saturday}
							onChange={e => {
								this.setState({ saturday: !this.state.saturday })
								this.props.editWeeklyTimer({
									id: this.props.weeklyTimer.id,
									saturday: !this.props.weeklyTimer.saturday
								});
							}} /> Lauantai <br />
					</div>
					<div className="row" style={styles.weekDayContainer}>
						<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.sunday}
							onChange={e => {
								this.setState({ sunday: !this.state.sunday })
								this.props.editWeeklyTimer({
									id: this.props.weeklyTimer.id,
									sunday: !this.props.weeklyTimer.sunday
								});
							}} /> Sunnuntai <br />
					</div>
				</div>
				<div className="col-xl-8">
					<div className="row">
						<div className="col">
							Tunnit:
									<input type="number" className="form-control" min="0" max="23" style={styles.minuteInput}
								value={this.state.hours}
								onChange={e => this.setState({ hours: e.target.value })}
								onBlur={e => this.props.editWeeklyTimer({
									id: this.props.weeklyTimer.id,
									hours: this.state.hours
								})} />
						</div>
						<div className="col">
							Minuutit:
									<input type="number" className="form-control" min="0" max="59" style={styles.hourInput}
								value={this.state.minutes}
								onChange={e => this.setState({ minutes: e.target.value })}
								onBlur={e => this.props.editWeeklyTimer({
									id: this.props.weeklyTimer.id,
									minutes: this.state.minutes
								})} />
						</div>
					</div>
					<table className="table table-bordered" style={styles.commandsTable}>
						<thead>
							<tr>
								<th><h5>Suoritettavat komennot</h5></th>
							</tr>
							<tr>
								<th><button className="btn btn-success"
									onClick={e => this.setState({ creatingNewCommand: true })}>Lisää Suoritettavat komento</button></th>
							</tr>
						</thead>
						<tbody>
							{this.state.creatingNewCommand ?
								<tr>
									<td>
										<h5>Kommennon tyyppi</h5>
										<select className="form-control"
											value={this.state.commandToBeExecuted}
											onChange={e => this.setState({ commandToBeExecuted: e.target.value })}>
											<option value="defaultState">Oletustilat</option>
											<option value="videoConnection">Videoyhteys</option>
											<option value="kwmConnection">Kwmyhteys</option>
										</select>
										{this.state.commandToBeExecuted === "videoConnection" ||
											this.state.commandToBeExecuted === "kwmConnection" ?
											<div style={{ marginTop: "20px" }}>
												<h5>Valitse matriisi</h5>
												<MatrixsSelect selectedMatrix={this.state.selectedMatrix}
												 onIdChanged={id => this.setState({ selectedMatrix: id })} />
												<div style={{ marginTop: "20px" }}>
													{this.state.selectedMatrix && this.state.selectedMatrix != "" ?
														<SelectPortConnection id={this.state.selectedMatrix}
															selectedConPort={this.state.selectedConPort}
															selectedCpuPort={this.state.selectedCpuPort}
															onConPortChanged={con => this.setState({ selectedConPort: con })}
															onCpuPortChanged={cpu => this.setState({ selectedCpuPort: cpu })} /> : ""}
												</div>
											</div> :
											this.state.commandToBeExecuted === "defaultState" ?
												<div style={{ marginTop: "20px" }}>
													<h5>Valitse oletustila</h5>
													<DefaultStateSelect selectedDefaultState={this.state.selectedDefaultState}
													 onIdChanged={id => this.setState({ selectedDefaultState: id })} />
												</div>
											: ""}
										<div className="row" style={{ marginTop: "20px" }}>
											<div className="col">
												<button className="btn btn-info"
													onClick={e => {
														switch (this.state.commandToBeExecuted) {
															case "videoConnection":
																this.props.addVideoConnectionToWeeklyTimer({						
																	id: this.props.weeklyTimer.id,
																	conPort: this.state.selectedConPort,
																	cpuPort: this.state.selectedCpuPort
																}).then(data => {
																	this.setState({
																		creatingNewCommand: false,
																		selectedMatrix: "",
																		selectedConPort: "",
																		selectedCpuPort: "",
																		selectedDefaultState: ""
																	});
																});
																break;
															case "kwmConnection":
																this.props.addKwmConnectionToWeeklyTimer({
																	id: this.props.weeklyTimer.id,
																	conPort: this.state.selectedConPort,
																	cpuPort: this.state.selectedCpuPort
																}).then(data => {
																	this.setState({
																		creatingNewCommand: false,
																		selectedMatrix: "",
																		selectedConPort: "",
																		selectedCpuPort: "",
																		selectedDefaultState: ""
																	});
																});
																break;
															case "defaultState":
																this.props.addDefaultStateToWeeklyTimer({
																	id: this.props.weeklyTimer.id,
																	defaultState: this.state.selectedDefaultState
																}).then(data => {
																	this.setState({
																		creatingNewCommand: false,
																		selectedMatrix: "",
																		selectedConPort: "",
																		selectedCpuPort: "",
																		selectedDefaultState: ""
																	});
																});
																break;
														}
													}}>Tallenna</button>
											</div>
											<div className="col"
												onClick={e => {

												}}>
												<button className="btn"
												 onClick={e => {
													 this.setState({
														 creatingNewCommand: false,
														 selectedMatrix: "",
														 selectedConPort: "",
														 selectedCpuPort: "",
														 selectedDefaultState: ""
													 });
												 }}>Peruuta</button>
											</div>
										</div>
									</td>
								</tr> : ""}
							<tr>
								<td>
									<Accordion>
										{this.props.weeklyTimer.videoConnections &&
										 this.props.weeklyTimer.videoConnections.length > 0 ?
										<AccordionCard header="Videoyhteydet">
											<ul className="list-group">
												{this.props.weeklyTimer.videoConnections.map(videoConnection => (
													<li className="list-group-item">
														<div className="row" style={{ width: "100%" }}>
															<div className="col-lg-6">
																<div className="row">
																	<div className="col">
																		Matriisi:
																	</div>
																	<div className="col">
																		{videoConnection.conPort.matrix.slug}
																	</div>
																</div>
																<div className="row">
																	<div className="col">
																		Näyttö:
																	</div>
																	<div className="col">
																		{`${videoConnection.conPort.portNum}. ${videoConnection.conPort.slug}`}
																	</div>
																</div>
																<div className="row">
																	<div className="col">
																		Kone:
																	</div>
																	<div className="col">
																		{`${videoConnection.cpuPort.portNum}. ${videoConnection.cpuPort.slug}`}
																	</div>
																</div>
															</div>
															<div className="col-lg-6">
																<button className="btn btn-danger"
																 onClick={e => {
																	 this.props.removeVideoConnectionFromWeeklyTimer({
																		id: this.props.weeklyTimer.id,
																		conPort: videoConnection.conPort.id
																	 });
																 }}>
																	Poista
																</button>
															</div>
														</div>
													</li>
												))}
											</ul>
										</AccordionCard> : ""}
										{this.props.weeklyTimer.kwmConnections &&
										 this.props.weeklyTimer.kwmConnections.length > 0 ?
										<AccordionCard header="Näppäimistöyhteydet">
											{this.props.weeklyTimer.kwmConnections.map(kwmConnection => (
												<li className="list-group-item">
													<div className="row" style={{ width: "100%" }}>
														<div className="col-lg-6">
															<div className="row">
																<div className="col">
																	Matriisi:
																</div>
																<div className="col">
																	{kwmConnection.conPort.matrix.slug}
																</div>
															</div>
															<div className="row">
																<div className="col">
																	Näppäimistö:
																</div>
																<div className="col">
																	{`${kwmConnection.conPort.portNum}. ${kwmConnection.conPort.slug}`}
																</div>
															</div>
															<div className="row">
																<div className="col">
																	Kone:
																</div>
																<div className="col">
																	{`${kwmConnection.cpuPort.portNum}. ${kwmConnection.cpuPort.slug}`}
																</div>
															</div>
														</div>
														<div className="col-lg-6">
															<button className="btn btn-danger"
															 onClick={e => {
																 this.props.removeKwmConnectionFromWeeklyTimer({
																	 id: this.props.weeklyTimer.id,
																	 cpuPort: kwmConnection.cpuPort.id
																 });
															 }}>
															 Poista
															</button>
														</div>
													</div>
												</li>
											))}
										</AccordionCard> : ""}
										{this.props.weeklyTimer.defaultStates &&
										 this.props.weeklyTimer.defaultStates.length > 0 ?
										<AccordionCard header="Oletustilat">
											{this.props.weeklyTimer.defaultStates.map(weeklyTimerDefaultState => {
												return (
													<li className="list-group-item">
														<div className="row" style={{ width: "100%" }}>
															<div className="col-lg-6">
																<div className="row">
																	<div className="col">
																		Oletustila:
																	</div>
																	<div className="col">
																		{weeklyTimerDefaultState.defaultState.slug}
																	</div>
																</div>
															</div>
															<div className="col-lg-6">
																<button className="btn btn-danger"
																 onClick={e => {
																	 this.props.removeDefaultStateFromWeeklyTimer({
																		 id: this.props.weeklyTimer.id,
																		 defaultState: weeklyTimerDefaultState.defaultState.id
																	 })
																 }}>
																 	Poista
																 </button>
															</div>
														</div>
													</li>);
											})}
										</AccordionCard> : ""}
									</Accordion>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		)
		}
	}
}

export default compose(
	graphql(gql`query weeklyTimer($id: String!) {
		weeklyTimer: weeklyTimerById(id: $id) {
			id
			slug
			hours
			minutes
			active
			monday
			tuesday
			wednesday
			thursday
			friday
			saturday
			sunday
			videoConnections {
				id
				conPort {
					id
					slug
					portNum
					matrix {
						slug
					}
				}
				cpuPort {
					id
					slug
					portNum
				}
			}
			kwmConnections {
				id
				conPort {
					id
					slug
					portNum
					matrix {
						slug
					}
				}
				cpuPort {
					id
					slug
					portNum
				}
			}
			defaultStates {
				id
				defaultState {
					id 
					slug
				}
			}
		}
	}`, {
		options: (ownProps) => ({
			variables: {
				id: ownProps.weeklyTimerId
			}
		}),
		props: ({ ownProps, data: { weeklyTimer } }) => ({
			weeklyTimer
		})
	}),
	graphql(gql`
	mutation editWeeklyTimer($id: String!, $slug: String, $minutes: Int, $hours: Int, $active: Boolean, $monday: Boolean, $tuesday: Boolean, $wednesday: Boolean, $thursday: Boolean, $friday: Boolean, $saturday: Boolean, $sunday: Boolean) {
		weeklyTimer: editWeeklyTimer (id: $id, slug: $slug, minutes: $minutes, hours: $hours, active: $active, monday: $monday, tuesday: $tuesday, wednesday: $wednesday, thursday: $thursday, friday: $friday, saturday: $saturday, sunday: $sunday) { 
			id
			slug
			active
			minutes
			hours
			monday
			tuesday
			wednesday
			thursday
			friday
			saturday
			sunday
		}
	}`, {
		props: ({ ownProps, mutate }) => ({
			editWeeklyTimer({id, slug, minutes, hours, monday, tuesday, 
							 wednesday, thursday, friday, saturday, sunday }) {
				return mutate({
					variables: {
						id,
						slug,
						minutes,
						hours,
						monday,
						tuesday,
						wednesday,
						thursday,
						friday,
						saturday,
						sunday
					},
					updateQueries: {
						weeklyTimer: (prev, { mutationResult }) => {
						}
					}
				})
			}
		})
	}),
	graphql(gql`
	mutation addVideoConnectionToWeeklyTimer($id: String!, $conPort: String!, $cpuPort: String!) {
		videoConnection: addVideoConnectionToWeeklyTimer(id: $id, conPort: $conPort, cpuPort: $cpuPort) {
			id
			weeklyTimer {
				id
			}
			conPort {
				id
				slug
				portNum
				matrix {
					id
					slug
				}
			}
			cpuPort {
				id
				slug
				portNum
			}
		}
	}`, {
		props: ({ ownProps, mutate }) => ({
			addVideoConnectionToWeeklyTimer({id, conPort, cpuPort}) {
				return mutate({
					variables: {
						id,
						conPort,
						cpuPort
					},
					updateQueries: {
						weeklyTimer: (prev, { mutationResult }) => {
							if (mutationResult.data.videoConnection.weeklyTimer.id === id && prev.weeklyTimer.videoConnections) {
								return {
									weeklyTimer: {
										...prev.weeklyTimer,
										videoConnections: [
											...prev.weeklyTimer.videoConnections,
											mutationResult.data.videoConnection
										]
									}
								};
							}
						}
					}
				})
			}
		})
	}),
	graphql(gql`
	mutation removeVideoConnectionFromWeeklyTimer($id: String!, $conPort: String!) {
		removeVideoConnectionFromWeeklyTimer(id: $id, conPort: $conPort)
	}`, {
		props: ({ ownProps, mutate }) => ({
			removeVideoConnectionFromWeeklyTimer({ id, conPort }) {
				return mutate({
					variables: {
						id,
						conPort
					},
					updateQueries: {
						weeklyTimer: (prev, { mutationResult }) => {
							if (prev.weeklyTimer.id === id && prev.weeklyTimer.videoConnections) {
								return Object.assign({}, prev, {
									weeklyTimer: Object.assign({}, prev.weeklyTimer, {
										videoConnections: prev.weeklyTimer.videoConnections.filter(p => p.conPort.id !== String(conPort))
									})
								});
							}
						}
					}
				})
			}
		})
	}),
	graphql(gql`
	mutation addKwmConnectionToWeeklyTimer($id: String!, $conPort: String!, $cpuPort: String!) {
		kwmConnection: addKwmConnectionToWeeklyTimer(id: $id, conPort: $conPort, cpuPort: $cpuPort) {
			id
			weeklyTimer {
				id
			}
			conPort {
				id
				slug
				portNum
				matrix {
					id
					slug
				}
			}
			cpuPort {
				id
				slug
				portNum
			}
		}
	}`, {
		props: ({ ownProps, mutate }) => ({
			addKwmConnectionToWeeklyTimer({ id, conPort, cpuPort }) {
				return mutate({
					variables: {
						id,
						conPort,
						cpuPort
					},
					updateQueries: {
						weeklyTimer: (prev, { mutationResult }) => {
							if (mutationResult.data.kwmConnection.weeklyTimer.id === id && prev.weeklyTimer.kwmConnections) {
								return {
									weeklyTimer: {
										...prev.weeklyTimer,
										kwmConnections: [
											...prev.weeklyTimer.kwmConnections,
											mutationResult.data.kwmConnection
										]
									}
								};
							}
						}
					}
				})
			}
		})
	}),
	graphql(gql`
	mutation removeKwmConnectionFromWeeklyTimer($id: String!, $cpuPort: String!) {
		removeKwmConnectionFromWeeklyTimer(id: $id, cpuPort: $cpuPort)
	}`, {
		props: ({ ownProps, mutate }) => ({
			removeKwmConnectionFromWeeklyTimer({ id, cpuPort }) {
				return mutate({
					variables: {
						id,
						cpuPort
					},
					updateQueries: {
						weeklyTimer: (prev, { mutationResult }) => {
							if (prev.weeklyTimer.id === id && prev.weeklyTimer.kwmConnections) {
								return Object.assign({}, prev, {
									weeklyTimer: Object.assign({}, prev.weeklyTimer, {
										kwmConnections: prev.weeklyTimer.kwmConnections.filter(p => p.cpuPort.id !== cpuPort)
									})
								});
							}
						}
					}
				})
			}
		})
	}),
	graphql(gql`
	mutation addDefaultStateToWeeklyTimer($id: String!, $defaultState: String!) {
		defaultState: addDefaultStateToWeeklyTimer(id: $id, defaultState: $defaultState) {
			id
			defaultState {
				id 
				slug
			}
			weeklyTimer {
				id
			}
		}	
	}`, {
		props: ({ ownProps, mutate }) => ({
			addDefaultStateToWeeklyTimer({ id, defaultState }) {
				return mutate({
					variables: {
						id,
						defaultState
					},
					updateQueries: {
						weeklyTimer: (prev, { mutationResult }) => {
							if (mutationResult.data.defaultState.weeklyTimer.id === id && prev.weeklyTimer.defaultStates) {
								return Object.assign({}, prev, {
									weeklyTimer: Object.assign({}, prev.weeklyTimer, {
										defaultStates: [...prev.weeklyTimer.defaultStates, mutationResult.data.defaultState]
									})
								});
							}
						}
					}
				})
			}
		})
	}),
	graphql(gql`
	mutation removeDefaultStateFromWeeklyTimer($id: String!, $defaultState: String!) {
		removeDefaultStateFromWeeklyTimer(id: $id, defaultState: $defaultState)
	}`, {
		props: ({ ownProps, mutate }) => ({
			removeDefaultStateFromWeeklyTimer({ id, defaultState }) {
				return mutate({
					variables: {
						id,
						defaultState
					},
					updateQueries: {
						weeklyTimer: (prev, { mutationResult }) => {
							if (prev.weeklyTimer.id === id && prev.weeklyTimer.defaultStates) {
								return Object.assign({}, prev, {
									weeklyTimer: Object.assign({}, prev.weeklyTimer, {
										defaultStates: prev.weeklyTimer.defaultStates.filter(p => p.defaultState.id !== defaultState)
									})
								});
							}
						}
					}
				})
			}
		})
	}),
	graphql(gql`
	mutation removeWeeklyTimer($id: String!) {
		removeWeeklyTimer(id: $id)
	}`, {
		props: ({ ownProps, mutate }) => ({
			removeWeeklyTimer({ id }) {
				return mutate({
					variables: {
						id
					},
					updateQueries: {
						weeklyTimers: (prev, { mutationResult }) => {
							return Object.assign({}, prev.weeklyTimers, {
								weeklyTimers: prev.weeklyTimers.filter(p => p.id !== id)
							});
						}
					}
				})
			}
		})
	})
)(WeeklyTimerListItem);