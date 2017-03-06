import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

var styles = {
	descriptionField: {
		textAlign: "right", 
		fontSize: "22px"
	}
};

class CreateNewTimer extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			slug: "",
			timerType: "weeklyTimer"
		};
	}

	render() {
		return (
			<div>
				<div className="row">
					<div className="col" style={styles.descriptionField}>
						Tunniste:
					</div>
					<div className="col">
						<input className="form-control"
							onChange={e => this.setState({ slug: e.target.value })} />
					</div>
				</div>
				<br />
				<div className="row">
					<div className="col" style={styles.descriptionField}>
						Ajastimen tyyppi:
					</div>
					<div className="col">
						<select className="form-control"
							onChange={e => this.setState({ timerType: e.target.value })}>
							<option value="weeklyTimer">Viikkoajastin</option>
							<option value="cronTimer">Cron</option>
						</select>
					</div>
				</div>
				<br />
				<div className="row">
					<div className="col">
					</div>
					<div className="col">
						<button className="btn btn-success float-right"
						 onClick={e => {
							switch(this.state.timerType) {
								case "weeklyTimer":
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
						<button className="btn float-right"
						 onClick={e => {
							 if (this.props.onCancelled) this.props.onCancelled();
						 }}>
							Peruuta
						</button>
					</div>
				</div>
			</div>
		)
	}
}

export default compose(
	graphql(gql`
	mutation ($slug: String!) {
		createWeeklyTimer(slug: $slug) {
			id
			slug
		}
	}`, { name: "createWeeklyTimer" }),
	graphql(gql`
	mutation ($slug: String!) {
		createCronTimer(slug: $slug) {
			id
			slug
		}
	}`, { name: "createCronTimer" })
)(CreateNewTimer);