import React from 'react';
import Settings from "../containers/Settings";

export default class extends React.Component {
    render() {
        console.log("slug on ", this.props.slug);
        if (this.props.matrix) {
        return (
            <Settings active="matriisit">                
                <div className="row-fluid">
                    <div className="row-fluid">
                        <h3>Tunniste</h3>
                    </div>
                    <div className="row-fluid">
                        <input type="text" className="form-control" value={this.props.matrix.slug} />
                    </div>
                    <br />
                    <div className="row-fluid">
                        <h3>Yhteys</h3>
                    </div>
                    <div className="row">
                        <div className="col-sm-6">
                            <input type="text" className="form-control" value={this.props.matrix.ip} />
                        </div>
                        <div className="col-sm-6">
                            <input type="number" className="form-control" value={this.props.matrix.port} />
                        </div>
                    </div>
                    <br />
                    <div className="row-fluid">
                        <h3>Portit</h3>
                    </div>
                    <br />
                    <div className="row">
                         <div className="col-sm-6">
                            <h5>Con ports</h5>
                            {this.props.matrix.conPorts ? this.props.matrix.conPorts.map(conPort => (
                                <input key={conPort.id} type="text" className="form-control" value={conPort.slug} />
                            )) : ""}
                        </div>
                        <div className="col-sm-6">
                            <h5>Cpu ports</h5>
                            {this.props.matrix.cpuPorts ? this.props.matrix.cpuPorts.map(cpuPort => (
                                <input key={cpuPort.id} type="text" className="form-control" value={cpuPort.slug} />
                            )) : ""}
                        </div>                       
                    </div>
                </div>
            </Settings>
        )
        } else {
            return (
                <Settings active="matriisit">
                </Settings>
            )
        }
    }
}