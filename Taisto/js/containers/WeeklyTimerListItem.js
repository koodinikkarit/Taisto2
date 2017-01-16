import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import WeeklyTimerListItem from "../components/WeeklyTimerListItem";

export default graphql(gql`
query weeklyTimer($id: String!) {
	weeklyTimer(id: $id) {
		id
		slug
	}	
}`, {
	props: ({ ownProps, data: { weeklyTimer } }) => ({
		weeklyTimer
	})
})(WeeklyTimerListItem);