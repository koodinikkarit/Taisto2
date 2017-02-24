import React from 'react';
import ReactDOM from 'react-dom';

var styles = {
	matrixBoard: {

	},
	matrixBoardConList: {
		width: "100%"
	},
	matrixBoardConListSelect: {
		width: "100%",
		height: "50px"
	},
	matrixBoardCpuList: {
	},
	matrixBoardItem: {

	},
	matrixBoardItemButton: {
		width: "100%",
		height: "50px"
	}
};

var videoConnectionColor = "rgb(244, 158, 66)";

export default class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selectedCon: ""
		}
	}

	render() {
		var that = this;
		console.log("videoCOnnections", this.props.videoConnections);
		return (
			<div className="row" style={{ width: "100%" }}>
				<div className="col">
					<div style={styles.matrixBoardConList}>
						<select style={styles.matrixBoardConListSelect}
						 value={this.state.selectedCon}
						 onChange={e => {
							this.setState({
								selectedCon: e.target.value
							});
						 }}>
							<option key=""></option>
							{this.props.conPorts ?
							 this.props.conPorts.map(con => {
								return (<option key={con.id} value={con.id}>{con.portNum+"."}{con.name}</option>);
							}) : ""}
						</select>
					</div>
					<div style={styles.matrixBoardCpuList}>
						{this.props.cpuPorts ?
						this.props.cpuPorts.map((cpu, index) => {
							console.log("vertaus ", cpu.id, this.props.videoConnections[this.state.selectedCon], this.state.selectedCon);
					   	 	return (<div key={cpu.id} style={styles.matrixBoardItem}>
								<button onClick={() => { if (that.props.onNewVideoConnection && this.state.selectedCon !== "") that.props.onNewVideoConnection(this.state.selectedCon, cpu.id); } } 
								style={{...styles.matrixBoardItemButton, backgroundColor: this.props.videoConnections[this.state.selectedCon] === cpu.id ? videoConnectionColor : "rgb(179, 229, 220)"}}>
									{cpu.portNum+"."}
									{cpu.name}
								</button>
							</div>);
						}) : ""}
					</div>
				</div>
			</div>
		);
	}
}