import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

class MatrixsSelect extends React.Component {
	render() {
		if (this.props.matrixs && !this.props.selectedMatrix &&
			this.props.matrixs.length > 0 && this.props.onIdChanged) {
				this.props.onIdChanged(this.props.matrixs[0].id);
		}

		return (
			<select className="form-control"
				onChange={e => {
					if (this.props.onIdChanged) this.props.onIdChanged(e.target.value)
				}}>
				{!this.props.selectedMatrix ? <option></option> : ""}
				{this.props.matrixs ? this.props.matrixs.map(matrix => (
					<option value={matrix.id}>{matrix.slug}</option>
				)) : ""}
			</select>
		)
	}
}

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