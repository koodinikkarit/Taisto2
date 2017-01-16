import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import MatrixsSelect from "../components/MatrixsSelect";



export default graphql(gql`
query {
	matrixs {
		id,
		slug
	}
}
`, {
	props: ({ ownProps, data: { matrixs } }) => ({
		matrixs
	})
})(MatrixsSelect);