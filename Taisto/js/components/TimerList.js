import React from 'react';

import Settings from "../containers/Settings";

import OnOffSwitch from "./OnOffSwitch";

export default class extends React.Component {
	render() {
		return (
			<Settings active="timers">
				<h1>TimerList</h1>
				<div className="row-fluid">
					<div className="col-sm-6">
						<h4>7:30</h4>
						MA TI KE TO PE
					</div>
					<div className="col-sm-6">
						<OnOffSwitch />
					</div>		
				</div>

			</Settings>
		)
	}
}