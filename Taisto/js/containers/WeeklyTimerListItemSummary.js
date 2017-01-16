import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import WeeklyTimerListItemSummary from "../components/WeeklyTImerListItemSummary";

export default compose(
	graphql(gql`
	mutation ($id: String!, $slug: String, $minutes: Int, $hours: Int, $active: Boolean, $monday: Boolean, $tuesday: Boolean, $wednesday: Boolean, $thursday: Boolean, $friday: Boolean, $saturday: Boolean, $sunday: Boolean) {
		editWeeklyTimer (id: $id, slug: $slug, minutes: $minutes, hours: $hours, active: $active, monday: $monday, tuesday: $tuesday, wednesday: $wednesday, thursday: $thursday, friday: $friday, saturday: $saturday, sunday: $sunday) { 
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
		name: "editWeeklyTimer"
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