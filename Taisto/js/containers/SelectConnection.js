import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

export default graphql(gql`
query {
	matrix(slug: "matriisi2") {
		id
		slug
	}
}`, {
	props: ({ ownProps, data: { matrix } }) => ({
		matrix
	})
})(class extends React.Component {
	render() {
		return(
			<h1>Hei</h1>
		)
	}
})