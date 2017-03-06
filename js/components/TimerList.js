import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import Measure from 'react-measure';

import CreateNewTimer from "../components/CreateNewTimer";
import WeeklyTimerListItemSummary from "./WeeklyTimerListItemSummary";
import WeeklyTimerOnOff from "./WeeklyTimerOnOff";

import Settings from "../containers/Settings";

class TimerList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			creatingNewTimer: false
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
				<div className="row">
					<div className="col-xl-6">
						{this.state.creatingNewTimer ?
							<CreateNewTimer onWeeklyTimerCreated={e => {
								this.props.refetchWeeklyTimers();
								this.setState({ creatingNewTimer: false });
							}}
							onCronTimerCreated={e => {
								this.props.refetchCronTimers();
								this.setState({ creatingNewTimer: false });
							}}
							onCancelled={e => {
								this.setState({ creatingNewTimer: false });
							}} /> : ""}

					</div>
					<div className="col-xl-10">
						{this.props.weeklyTimers ?
							<div>
								<h2 style={{ marginBottom: "30px", marginTop: "40px" }}>Viikottaiset ajastimet.</h2>
								{this.props.weeklyTimers.map(weeklyTimer => (
									<WeeklyTimerListItemSummary weeklyTimerId={weeklyTimer.id} />
								))}
							</div> : ""}
					</div>
				</div>
			</Settings>
		)
	}
}

export default compose(
	graphql(gql`
	query weeklyTimers {
		weeklyTimers {
			id
			slug
			minutes
			hours
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
		props: ({ ownProps, data: { weeklyTimers, refetch } }) => ({
			weeklyTimers,
			refetchWeeklyTimers: refetch
		})
	}),
	// graphql(gql`
	// query {
	// 	cronTimers {
	// 		id
	// 		slug
	// 	}
	// }`, {
	// 	props: ({ ownProps, data: { cronTimers, refetch } }) => ({
	// 		cronTimers,
	// 		refetchCronTimers: refetch
	// 	})
	// })		
)(TimerList);