import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';


import DefaultStates from "../components/DefaultStates";

export default graphql(gql`
query {
	defaultStates {
		id
	}
}
`, {	
})(DefaultStates);