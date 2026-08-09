import React from 'react';
import { graphql } from '@apollo/client/react/hoc';
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