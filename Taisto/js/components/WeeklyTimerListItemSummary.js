import React from 'react';

import OnOffSwitch from "./OnOffSwitch";
import MatrixsSelect from "../containers/MatrixsSelect";
import SelectPortConnection from "../containers/SelectPortConnection";
import WeeklyTimerListItem from "../components/WeeklyTimerListItem";

export default class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			expanded: false,
			monday: false,
			tuesday: false,
			wednesday: false,
			thursday: false,
			friday: false,
			saturday: false,
			sunday: false,
			minutes: 0,
			hours: 0,
			creatingNewCommand: false,
			commandToBeExecuted: "",
			selectedMatrix: "",
			selectedConPort: "",
			selectedCpuPort: "",
			editing: { }
		};
	}

	render() {
		var styles = {
			timerListItemSummaryContainer: {
				marginBottom: "25px"
			}
		}
		return (
			<div>
				<div className="list-group-item-action" style={styles.timerListItemSummaryContainer}
					onClick={e => {
						this.setState({ expanded: !this.state.expanded });
					} }>
					<div className="row">
						<div className="col">
							<h2>{this.props.weeklyTimer.slug}</h2>
						</div>
					</div>
					<div className="row">
						<div className="col-6">
							<h4>{this.props.weeklyTimer.hours ? this.props.weeklyTimer.hours : "0"}:{this.props.weeklyTimer.minutes ?
								 this.props.weeklyTimer.minutes < 10 ? "0" + this.props.weeklyTimer.minutes : this.props.weeklyTimer.minutes
								 : "00"}</h4>
							{this.props.weeklyTimer.monday ? " MA " : ""}
							{this.props.weeklyTimer.tuesday ? " TI " : ""}
							{this.props.weeklyTimer.wednesday ? " KE " : ""}
							{this.props.weeklyTimer.thursday ? " TO " : ""}
							{this.props.weeklyTimer.friday ? " PE " : ""}
							{this.props.weeklyTimer.saturday ? " LA " : ""}
							{this.props.weeklyTimer.sunday ? " SU " : ""}
						</div>
						<div className="col-6">
							<OnOffSwitch on={this.props.weeklyTimer.active} onSwitch={mode => {
								this.props.editWeeklyTimer({
									variables: {
										id: this.props.weeklyTimer.id,
										active: mode
									}
								}).then(data => {
									this.props.refetch();
								})
							} } />

						</div>
					</div>
				</div>
				{this.state.expanded ?
				<WeeklyTimerListItem weeklyTimer={this.props.weeklyTimer} 
				editWeeklyTimer={this.props.editWeeklyTimer} refetch={this.props.refetch}
				removeWeeklyTimer={this.props.removeWeeklyTimer} 
				addVideoConnectionToWeeklyTimer={this.props.addVideoConnectionToWeeklyTimer}
				 />	 : ""}
			</div>
		)
	}
}

