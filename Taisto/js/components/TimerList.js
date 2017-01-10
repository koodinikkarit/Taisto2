import React from 'react';

import Settings from "../containers/Settings";

export default class extends React.Component {
	render() {
		return (
			<Settings active="timers">
				<h1>TimerList</h1>
			</Settings>
		)
	}
}