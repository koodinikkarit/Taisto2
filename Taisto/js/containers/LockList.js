import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';


import LockList from "../components/LockList";

export default graphql(gql`
query {
	locks {
		id
	}
}
`, {	
})(LockList);