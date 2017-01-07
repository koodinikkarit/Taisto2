import React from 'react';

import PageLayout from "./PageLayout";

export default class extends React.Component {
	render() {
		var styles = {
			sideBar: {
				position: "fixed",
				top: "51px",
				bottom: 0,
				left: 0,
				zIndex: 1000,
				padding: "20px",
				overflowX: "hidden",
				overflowY: "auto",
				borderRight: "1px solid #eee"			
			}
		};

		return (
			<div className="row">
				<nav className="col-sm-3 col-md-2 hidden-xs-down bg-faded sidebar" style={styles.sideBar}>
					<ul className="nav nav-pills flex-column">
						<li className="nav-item">
							<a className="nav-link active" href="#asetukset">Matriisit <span className="sr-only">(current)</span></a>
						</li>
						<li className="nav-item">
							<a className="nav-link" href="#section">Ajastimet</a>
						</li>
						<li className="nav-item">
							<a className="nav-link" href="#">Lukot</a>
						</li>
						<li className="nav-item">
							<a className="nav-link" href="#">Oletustilat</a>
						</li>
						<li className="nav-item">
							<a className="nav-link" href="#">Kaaviot</a>
						</li>
						<li className="nav-item">
							<a className="nav-link" href="#">Käännökset</a>
						</li>
					</ul>
				</nav>
				<main className="col-sm-9 offset-sm-3 col-md-10 offset-md-2 pt-3">
					<h1 id="matrixs">Matriisit</h1>
					<button className="btn btn-success">Luo matriisi</button>
					
				</main>
			</div>
		)
	}
}