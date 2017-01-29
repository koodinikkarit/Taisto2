import React from 'react';

export default class extends React.Component {
	render() {
		return (
			<select className="form-control"
				onChange={e => {
					if (this.props.onIdChanged) this.props.onIdChanged(e.target.value)
				}}>
				<option></option>
				{this.props.matrixs ? this.props.matrixs.map(matrix => (
					<option value={matrix.id}>{matrix.slug}</option>
				)) : ""}
			</select>
		)
	}
}