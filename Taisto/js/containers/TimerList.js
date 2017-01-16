import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import TimerList from "../components/TimerList";

export default graphql(gql`
query {
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
}
`, {
	props: ({ ownProps, data: { weeklyTimers, refetch } }) => ({
		weeklyTimers,
		refetchWeeklyTimers: refetch
	})
})(
graphql(gql`
query {
	cronTimers {
		id
		slug
	}
}`, {
	props: ({ ownProps, data: { cronTimers, refetch } }) => ({
		cronTimers,
		refetchCronTimers: refetch
	})
})(TimerList));