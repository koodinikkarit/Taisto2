import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';


import OnOffSwitch from "./OnOffSwitch";


class WeeklyTimerOnOff extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<OnOffSwitch on={this.props.weeklyTimer.active} onSwitch={mode => {
				this.props.editWeeklyTimer({
					id: this.props.weeklyTimer.id,
					active: mode
				});
			} } />
		)
	}
}


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
			videoConnections {
				id
			}
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
							//console.log("updatee", mutationResult, id, prev);
							// return {weeklyTimer:{...mutationResult.data.weeklyTimer}}
							// //if (mutationResult.data.weeklyTimer.id === id) {
							// 	console.log("läpi menmi", Object.assign({}, prev, {
							// 		weeklyTimer: mutationResult.data.weeklyTimer
							// 	}), prev);
							// 	prev.weeklyTimer.active = true;
							// 	console.log("it is ", prev);
							// 	return prev;
							// //}
						}
					}
				})
			}
		})
	})
)(WeeklyTimerOnOff);