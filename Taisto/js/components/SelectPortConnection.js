import React from 'react';

export default class extends React.Component {
	render() {
		return(
			<div className="row">
				<div className="col">
					<h5>Con port</h5>
					<select className="form-control" value={this.props.selectedConPort}
						onChange={e => {
							if (this.props.onConPortChanged) this.props.onConPortChanged(e.target.value);
						}}>
						{this.props.matrix && this.props.matrix.conPorts ?
						this.props.matrix.conPorts.map(conPort => (
							<option value={conPort.id}>{conPort.slug ? conPort.slug : conPort.portNum}</option>
						)) : ""}
					</select>
				</div>
				<div className="col">
					<h5>Cpu port</h5>
					<select className="form-control" value={this.props.selectedCpuPort}
						onChange={e => {
							if (this.props.onCpuPortChanged) this.props.onCpuPortChanged(e.target.value);
						}}>
						{this.props.matrix && this.props.matrix.cpuPorts ?
						this.props.matrix.cpuPorts.map(cpuPort => (
							<option value={cpuPort.id}>{cpuPort.slug ? cpuPort.slug : cpuPort.portNum}</option>
						)) : ""}
					</select>
				</div>
			</div>
		)
	}
}