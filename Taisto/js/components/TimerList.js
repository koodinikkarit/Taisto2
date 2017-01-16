import React from 'react';
import Measure from 'react-measure';

import CreateNewTimer from "../containers/CreateNewTimer";
import WeeklyTimerListItemSummary from "../containers/WeeklyTimerListItemSummary";

import Settings from "../containers/Settings";

export default class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			width: 0,
			creatingNewTimer: false,


		};
	}

	render() {
		return (
			<Settings active="timers">
				<div className="row">
					<div className="col-6">
						<h1>Ajastimet</h1>
					</div>
					<div className="col-4">
						<button className="btn btn-success"
						 onClick={e => {
							 this.setState({ creatingNewTimer: true })
						 }}>Luo uusi ajastin</button>
					</div>
				</div>
				<Measure onMeasure={diemensions => this.setState({ width: diemensions.width })}>
				<div>
					<div className={this.state.width > 900 ? "col-sm-6" : "col-sm-12"}>
						{this.state.creatingNewTimer ? 
							<CreateNewTimer onWeeklyTimerCreated={e => {
								 this.props.refetchWeeklyTimers();
								 this.setState({ creatingNewTimer: false });
							}}
							onCronTimerCreated={e => {
								 this.props.refetchCronTimers();
								 this.setState({ creatingNewTimer: false });
							}} /> : ""}
						
					</div>
					<div className={this.state.width > 900 ? "col-sm-6" : "col-sm-12"}>
						{this.props.weeklyTimers ?
						<div>
							<h2 style={{ marginBottom: "30px", marginTop: "40px" }}>Viikottaiset ajastimet.</h2>
							{this.props.weeklyTimers.map(weeklyTimer => (
								<WeeklyTimerListItemSummary weeklyTimer={weeklyTimer} refetch={this.props.refetchWeeklyTimers} />
							))}
						</div>: ""}
					</div>
				</div>
				</Measure>
			</Settings>
		)
	}
}