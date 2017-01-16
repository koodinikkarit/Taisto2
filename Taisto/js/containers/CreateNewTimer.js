import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import CreateNewTimer from "../components/CreateNewTimer";

export default compose(
	graphql(gql`
	mutation ($slug: String!) {
		createWeeklyTimer(slug: $slug) {
			id
			slug
		}
	}`, { name: "createWeeklyTimer" }),
	graphql(gql`
	mutation ($slug: String!) {
		createCronTimer(slug: $slug) {
			id
			slug
		}
	}`, { name: "createCronTimer" })
)(CreateNewTimer);