import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import TimerList from "../components/TimerList";

export default graphql(gql`
query {
	timers {
		id
		slug
	}
}
`)(TimerList);