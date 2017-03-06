import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import OnOffSwitch from "./OnOffSwitch";
import WeeklyTimerListItem from "../components/WeeklyTimerListItem";

class WeeklyTimerListItemSummary extends React.Component {
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

		if (this.props.weeklyTimer) {
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
									id: this.props.weeklyTimer.id,
									active: mode
								}).then(data => {
								})
							} } />

						</div>
					</div>
				</div>
				<div>
					{this.state.expanded ?
					<WeeklyTimerListItem weeklyTimerId={this.props.weeklyTimer.id} /> : ""}
				</div>
			</div>
		)
		} else {
			return <h1>ei oo</h1>
		}
	}
}








				// editWeeklyTimer={this.props.editWeeklyTimer}
				// removeWeeklyTimer={this.props.removeWeeklyTimer} 
				// addVideoConnectionToWeeklyTimer={this.props.addVideoConnectionToWeeklyTimer}


export default compose(
	graphql(gql`
	query weeklyTimer($id: String!) {
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
		}
	}`, {
		options: ({weeklyTimerId}) => ({
			variables: {
				id: weeklyTimerId
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
			editWeeklyTimer({id, active}) {
				return mutate({
					variables: {
						id,
						active
					 },
					updateQueries: {
						weeklyTimer: (prev, { mutationResult }) => {
							if (prev.weeklyTimer.id === id)
							 return {weeklyTimer:{...mutationResult.data.weeklyTimer}}
						}
					}
				})
			}
		})
	}),
	graphql(gql`
	mutation ($id: String!) {
		removeWeeklyTimer (id: $id)
	}`, {
		name: "removeWeeklyTimer"
	}),
	graphql(gql`
	mutation ($weeklyTimer: String!, $matrix: String!, $conPort: String!, $cpuPort: String!) {
		addVideoConnectionToWeeklyTimer (weeklyTimer: $weeklyTimer, matrix: $matrix, conPort: $conPort, cpuPort: $cpuPort) {
			id
			matrix {
				id

			}
			conPort {
				id
			}
			cpuPort {
				id
			}
		}
	}`, {
		name: "addVideoConnectionToWeeklyTimer"
	})
)(WeeklyTimerListItemSummary);