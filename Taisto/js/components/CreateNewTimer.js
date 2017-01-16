import React from 'react';

export default class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			slug: "",
			timerType: ""
		};
	}

	render() {
		return (
			<div className="row">
				<h5>Tunniste</h5>
				<input className="form-control" 
				onChange={e => this.setState({ slug: e.target.value })}/>
				<select className="form-control"
				onChange={e => this.setState({ timerType: e.target.value })}>
					<option></option>
					<option value="weekTimer">Viikkoajastin</option>
					<option value="cronTimer">Cron</option>
				</select>
				<button className="btn btn-success"
				onClick={e => {
					switch(this.state.timerType) {
						case "weekTimer":
							this.props.createWeeklyTimer({ 
								variables: {
									slug: this.state.slug
								}
							}).then(
								data => {
									if (this.props.onWeeklyTimerCreated) this.props.onWeeklyTimerCreated();
								} 
							)
							break;
						case "cronTimer":
							this.props.createCronTimer({
								variables: {
									slug: this.state.slug
								}
							}).then(
								data => {
									if (this.props.onCronTimerCreated) this.props.onCronTimerCreated();
								}
							)
							break;
					}
				}}>
					Luo
				</button>
			</div>
		)
	}
}