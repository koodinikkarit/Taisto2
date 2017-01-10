import React from 'react';
import Measure from 'react-measure';

import PageLayout from "./PageLayout";

export default class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			width: 0
		};
	}

	render() {
		var styles = {
			sideBar: {
				//position: "fixed",
				//top: "51px",
				bottom: 0,
				left: 0,
				zIndex: 1000,
				padding: "20px",
				overflowX: "hidden",
				overflowY: "auto",
				borderRight: "1px solid #eee"			
			}
		};

		if (!this.state.width || this.state.width > 545) {
			styles.sideBar.position = "fixed";
			styles.sideBar.top = "51px";
		}
		return (
			<Measure onMeasure={({ width }) => this.setState({ width })} >
				<div className="row">
					<nav className="col-sm-3 col-md-2 bg-faded sidebar" style={styles.sideBar}>
						<ul className="nav nav-pills flex-column">
							<li className="nav-item">
								<a className={this.props.active === "matriisit" ? "nav-link active" : "nav-link"} href="/settings/matriisit">Matriisit</a>
							</li>
							<li className="nav-item">
								<a className={this.props.active === "timers" ? "nav-link active" : "nav-link"} href="/settings/timers">Ajastimet</a>
							</li>
							<li className="nav-item">
								<a className={this.props.active === "locks" ? "nav-link active" : "nav-link"} href="/settings/locks">Lukot</a>
							</li>
							<li className="nav-item">
								<a className={this.props.active === "oletustilat" ? "nav-link active" : "nav-link"} href="/settings/oletustilat">Oletustilat</a>
							</li>
							<li className="nav-item">
								<a className={this.props.active === "diagrams" ? "nav-link active" : "nav-link"} href="/settings/diagrams">Kaaviot</a>
							</li>
							<li className="nav-item">
								<a className={this.props.active === "translations" ? "nav-link active" : "nav-link"} href="/settings/translations">Käännökset</a>
							</li>
						</ul>
					</nav>
					<main className="col-sm-9 offset-sm-3 col-md-10 offset-md-2 pt-3">
						{this.props.children}
					</main>
				</div>
			</Measure>
		)
	}
}