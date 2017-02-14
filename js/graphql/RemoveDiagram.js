import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

export default graphql(gql`
mutation ($id: String!) {
	removeDiagram(id: $id)
}`, {
	props: ({ownProps, mutate}) => {
		return {
			removeDiagram({ id }) {
				return mutate({
					variables: { id },
					updateQueries: {
						Diagrams: (prev, { mutationResult }) => {
							console.log("poistetaan",Object.assign({}, prev, {
								diagrams: [...prev.diagrams.filter(p => p.id != id)]
							}));
							return Object.assign({}, prev, {
								diagrams: [...prev.diagrams.filter(p => p.id != id)]
							});
						}
					}
				})
			}
		}
	}
});