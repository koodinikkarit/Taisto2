import React from 'react';

import Settings from "../containers/Settings";

export default class extends React.Component {
	render() {
		return (
			<Settings active="locks">
				<h1>LockList</h1>
			</Settings>
		)
	}
}