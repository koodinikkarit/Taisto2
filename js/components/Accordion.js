import React from 'react';

import AccordionCard from "./AccordionCard";

export default class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			
		}
	}

	render() {
		return(
			<div role="tablist" aria-multiselectable="true">
				{this.props.children}
			</div>
		)
	}
}