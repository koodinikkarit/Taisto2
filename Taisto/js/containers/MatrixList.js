import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import MatrixList from "../components/MatrixList";

export default graphql(gql`
query {
	matrixs {
		id
	}
}
`, {
})(MatrixList);