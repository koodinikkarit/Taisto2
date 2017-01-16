import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import SelectPortConnection from "../components/SelectPortConnection";
 

export default graphql(gql`
query ($id: String!){
	matrix: matrixById(id: $id) {
		id
		slug
		conPorts {
			id
			slug
			portNum
		}
		cpuPorts {
			id
			slug
			portNum
		}
	}
}`, {
	options: (ownProps) => {
		return {
			variables: {
				id: ownProps.id
			}
		}
	},
	props: ({ ownProps, data: { matrix } }) => ({
		matrix
	})
})(SelectPortConnection)