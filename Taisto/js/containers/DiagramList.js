import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';


import DiagramList from "../components/DiagramList";

export default graphql(gql`
query {
	diagrams {
		id
	}
}
`, {	
})(DiagramList);