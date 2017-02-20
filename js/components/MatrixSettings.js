import React from 'react';
import Settings from "../containers/Settings";

export default class extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            slug: "",
            ip: "",
            port: "",
            conPorts: { },
            cpuPorts: { }
        };
    }

    componentWillReceiveProps(nextProps) {
        var conPorts = {};
        var cpuPorts = {};

        if (nextProps.matrix.conPorts)
        nextProps.matrix.conPorts.forEach(conPort => conPorts[conPort.id] = conPort.slug );
        if (nextProps.matrix.cpuPorts)
        nextProps.matrix.cpuPorts.forEach(cpuPort => cpuPorts[cpuPort.id] = cpuPort.slug );

        this.setState({
            slug: nextProps.matrix.slug,
            ip: nextProps.matrix.ip,
            port: nextProps.matrix.port,
            conPorts,
            cpuPorts
        });
    }

    render() {
        if (this.props.matrix) {
            return (
                <Settings active="matriisit">
                    <div className="row-fluid">
                        <div className="row-fluid">
                            <h3>Tunniste</h3>
                        </div>
                        <div className="row-fluid">
                            <input type="text" className="form-control"
                                onChange={e => this.setState({ slug: e.target.value })}
                                value={this.state.slug}
                                onBlur={e => {
                                    this.props.editMatrixMutation({ variables: { id: this.props.matrix.id, slug: e.target.value } })
                                } }
                                onKeyPress={e => {
                                    if (e.key === "Enter") {
                                        this.props.editMatrixMutation({ variables: { id: this.props.matrix.id, slug: e.target.value } })
                                    }
                                } } />
                        </div>
                        <br />
                        <div className="row-fluid">
                            <h3>Yhteys</h3>
                        </div>
                        <div className="row">
                            <div className="col-sm-6">
                                <input type="text" className="form-control"
                                    onChange={e => this.setState({ ip: e.target.value })}
                                    value={this.state.ip}
                                    onBlur={e => {
                                        this.props.editMatrixMutation({ variables: { id: this.props.matrix.id, ip: e.target.value } })
                                    } }
                                    onKeyPress={e => {
                                        if (e.key === "Enter") {
                                            this.props.editMatrixMutation({ variables: { id: this.props.matrix.id, ip: e.target.value } }).then(({data}) => console.log("got data ", data));
                                        }
                                    } } />
                            </div>
                            <div className="col-sm-6">
                                <input type="number" className="form-control"
                                    onChange={e => this.setState({ port: e.target.value })}
                                    value={this.state.port}
                                    onBlur={e => {
                                        this.props.editMatrixMutation({ variables: { id: this.props.matrix.id, port: e.target.value } })
                                            .then(({data}) => console.log("got data ", data));
                                    } }
                                    onKeyPress={e => {
                                        if (e.key === "Enter") {
                                            this.props.editMatrixMutation({ variables: { id: this.props.matrix.id, port: e.target.value } })
                                                .then(({data}) => console.log("got data ", data));
                                        }
                                    } } />
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
                                    <input key={conPort.id} type="text" className="form-control" value={this.state.conPorts[conPort.id]}
                                        onChange={e => {
                                            this.state.conPorts[conPort.id] = e.target.value;
                                            this.forceUpdate();
                                        } }
                                        onBlur={e => {
                                            this.props.editConPortMutation({ variables: { id: conPort.id, slug: e.target.value } }).then(({data}) => console.log("got data ", data));
                                        } }
                                        onKeyPress={e => {
                                            if (e.key === "Enter") {
                                                this.props.editConPortMutation({ variables: { id: conPort.id, slug: e.target.value } }).then(({data}) => console.log("got data ", data));
                                            }
                                        } } />
                                )) : ""}
                            </div>
                            <div className="col-sm-6">
                                <h5>Cpu ports</h5>
                                {this.props.matrix.cpuPorts ? this.props.matrix.cpuPorts.map(cpuPort => (
                                    <input key={cpuPort.id} type="text" className="form-control" value={this.state.cpuPorts[cpuPort.id]}
                                        onChange={e => {
                                            this.state.cpuPorts[cpuPort.id] = e.target.value;
                                            this.forceUpdate();
                                        } }
                                        onBlur={e => {
                                            this.props.editCpuPortMutation({ variables: { id: cpuPort.id, slug: e.target.value } }).then(({data}) => console.log("got data ", data));
                                        } }
                                        onKeyPress={e => {
                                            if (e.key === "Enter") {
                                                this.props.editCpuPortMutation({ variables: { id: cpuPort.id, slug: e.target.value } }).then(({data}) => console.log("got data ", data));
                                            }
                                        } } />
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