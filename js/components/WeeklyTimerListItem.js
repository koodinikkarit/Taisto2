import React from 'react';

import MatrixsSelect from "../containers/MatrixsSelect";
import SelectPortConnection from "../containers/SelectPortConnection";

export default class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			creatingNewCommand: false,
			commandToBeExecuted: "",
			selectedMatrix: "",
			selectedConPort: "",
			selectedCpuPort: "",			
		}
	}

	componentWillReceiveProps(nextProps) {
		this.setState({
			monday: nextProps.weeklyTimer.monday ? nextProps.weeklyTimer.monday : false
		});
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

		return (
			<div className="row">
						<div className="col-sm-3">
							<div className="row">
								<button className="btn btn-danger"
								onClick={e => {
									this.props.removeWeeklyTimer({
										variables: {
											id: this.props.weeklyTimer.id
										}
									}).then(data => this.props.refetch());
								}}>
									Poista ajastin
								</button>
							</div>
							<div className="row" style={styles.weekDayContainer}>
								<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.monday}
								onChange={e => {
									this.setState({ monday: !this.state.monday })
									this.props.editWeeklyTimer({
										variables: {
											id: this.props.weeklyTimer.id,
											monday: !this.props.weeklyTimer.monday
										}
									}).then(data => this.props.refetch());
								}} /> Maanantai
							</div>
							<div className="row" style={styles.weekDayContainer}>
								<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.tuesday}
								onChange={e => {
									this.setState({ tuesday: !this.state.tuesday })
									this.props.editWeeklyTimer({
										variables: {
											id: this.props.weeklyTimer.id,
											tuesday: !this.props.weeklyTimer.tuesday
										}
									}).then(data => this.props.refetch());
								}}  /> Tiistai <br />
							</div>
							<div className="row" style={styles.weekDayContainer}>
								<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.wednesday}
								onChange={e => {
									this.setState({ wednesday: !this.state.wednesday })
									this.props.editWeeklyTimer({
										variables: {
											id: this.props.weeklyTimer.id,
											wednesday: !this.props.weeklyTimer.wednesday
										}
									}).then(data => this.props.refetch());
								}}  /> Keskiviikko <br />
							</div>
							<div className="row" style={styles.weekDayContainer}>
								<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.thursday}
								onChange={e => {
									this.setState({ thursday: !this.state.thursday })
									this.props.editWeeklyTimer({
										variables: {
											id: this.props.weeklyTimer.id,
											thursday: !this.props.weeklyTimer.thursday
										}
									}).then(data => this.props.refetch());
								}} /> Torstai <br />
							</div>
							<div className="row" style={styles.weekDayContainer}>
								<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.friday}
								onChange={e => {
									this.setState({ friday: !this.state.friday })
									this.props.editWeeklyTimer({
										variables: {
											id: this.props.weeklyTimer.id,
											friday: !this.props.weeklyTimer.friday
										}
									}).then(data => this.props.refetch());
								}}  /> Perjantai <br />
							</div>
							<div className="row" style={styles.weekDayContainer}>
								<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.saturday}
								onChange={e => {
									this.setState({ saturday: !this.state.saturday })
									this.props.editWeeklyTimer({
										variables: {
											id: this.props.weeklyTimer.id,
											saturday: !this.props.weeklyTimer.saturday
										}
									}).then(data => this.props.refetch());
								}}  /> Lauantai <br />
							</div>
							<div className="row" style={styles.weekDayContainer}>
								<input type="checkbox" style={styles.weekdayCheckBox} checked={this.props.weeklyTimer.sunday}
								onChange={e => {
									this.setState({ sunday: !this.state.sunday })
									this.props.editWeeklyTimer({
										variables: {
											id: this.props.weeklyTimer.id,
											sunday: !this.props.weeklyTimer.sunday
										}
									}).then(data => this.props.refetch());
								}}  /> Sunnuntai <br />
							</div>
						</div>
						<div className="col-sm-9">
							<div className="row">
								<div className="col">
									Tunnit:
									<input type="number" className="form-control" min="0" max="23" style={styles.minuteInput}
										value={this.state.hours}
										onChange={e => this.setState({ hours: e.target.value })}
										onBlur={e => this.props.editWeeklyTimer({
											variables: {
												id: this.props.weeklyTimer.id,
												hours: this.state.hours
											}
										}).then(data => this.props.refetch())} />
								</div>
								<div className="col">
									Minuutit:
									<input type="number" className="form-control" min="0" max="59" style={styles.hourInput}
										value={this.state.minutes}
										onChange={e => this.setState({ minutes: e.target.value })}
										onBlur={e => this.props.editWeeklyTimer({
											variables: {
												id: this.props.weeklyTimer.id,
												minutes: this.state.minutes
											}
										}).then(data => this.props.refetch())} />
								</div>
							</div>
							<table className="table table-bordered table-hover" style={styles.commandsTable}>
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
											 onChange={e => this.setState({ commandToBeExecuted: e.target.value })}>
												<option value=""></option>
												<option value="defaultStates">Oletustilat</option>
												<option value="videoConnection">Videoyhteys</option>
												<option value="kwmConnection">Kwmyhteys</option>
											</select>
											{ this.state.commandToBeExecuted === "videoConnection" ||
											  this.state.commandToBeExecuted === "kwmConnection" ?
											<div style={{ marginTop: "20px" }}>
												<h5>Valitse matriisi</h5>
												<MatrixsSelect onIdChanged={id => this.setState({ selectedMatrix: id })} />
												<div style={{ marginTop: "20px" }}>
													{this.state.selectedMatrix && this.state.selectedMatrix != "" ?
														<SelectPortConnection id={this.state.selectedMatrix}
														selectedConPort={this.state.selectedConPort}
														selectedCpuPort={this.state.selectedCpuPort}
														onConPortChanged={con => this.setState({ selectedConPort: con })}
														onCpuPortChanged={cpu => this.setState({ selectedCpuPort: cpu })} /> : ""}
												</div>
											</div> : "" }
											<div className="row" style={{ marginTop: "20px" }}>
												<div className="col">
													<button className="btn btn-info"
													onClick={e => {
														switch (this.state.commandToBeExecuted) {
															case "videoConnection":
																this.props.addVideoConnectionToWeeklyTimer({
																	variables: {
																		matrix: this.state.selectedMatrix,
																		weeklyTimer: this.props.weeklyTimer.id,
																		conPort: this.state.selectedConPort,
																		cpuPort: this.state.selectedCpuPort
																	}
																});
																break;
														}
													}}>Tallenna</button>
												</div>
												<div className="col"
												onClick={e => {

												}}>
													<button className="btn">Peruuta</button>
												</div>
											</div>
										</td>
									</tr> : ""}
									<tr>
										<td><a href="#" className="list-group-item-action">Aseta oletustila</a></td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>			
		)
	}
}