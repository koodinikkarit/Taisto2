import React from 'react';

export default class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			expanded: false
		}
	}

	render() {
		return (
			<div className="card">
				<div className="card-header" role="tab">
					<h5 className="mb-0">
						<a data-toggle="collapse" href="#" aria-expanded="true" aria-controls="collapseOne"
							onClick={e => {
								e.stopPropagation();
								this.setState({
									expanded: !this.state.expanded
								});
							}}>
							{this.props.header}
						</a>
					</h5>
				</div>

				<div className={this.state.expanded ? "collapse show" : "collapse"} role="tabpanel" aria-labelledby="headingOne">
					<div className="card-block">
						{this.props.children}
					</div>
				</div>
			</div>
		)
	}
}