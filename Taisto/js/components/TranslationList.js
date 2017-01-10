import React from 'react';

import Settings from "../containers/Settings";

export default class extends React.Component {
	render() {
		return (
			<Settings active="translations">
				<h1>TranslationList</h1>
			</Settings>
		)
	}
}