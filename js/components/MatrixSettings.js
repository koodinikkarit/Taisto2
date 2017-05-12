import React from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import Settings from "../containers/Settings";

class MatrixSettings extends React.Component {
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
                        <div className="row" style={{ marginBottom: "20px" }}>
                            <div className="col">
                                <h3>Tunniste</h3>
                            </div>
                            <div className="col">
                                <button className="btn btn-danger"
								 onClick={e => this.props.removeMatrix({
									 id: this.props.matrix.id
								 }).then(data => {
									 if (data.data.removeMatrix)
									 this.props.history.push("/settings/matriisit");
								 })}>Poista</button>
                            </div>
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
                                {this.props.matrix.conPorts ? this.props.matrix.conPorts.map((conPort, index) => (
                                    <div>
                                        {`${index+1}. `}
                                        <input key={conPort.id} type="text" className="form-control" value={this.state.conPorts[conPort.id]}
                                            onChange={e => {
                                                this.state.conPorts[conPort.id] = e.target.value;
                                                this.forceUpdate();
                                            }}
                                            onBlur={e => {
                                                this.props.editConPortMutation({ variables: { id: conPort.id, slug: e.target.value } }).then(({ data }) => console.log("got data ", data));
                                            }}
                                            onKeyPress={e => {
                                                if (e.key === "Enter") {
                                                    this.props.editConPortMutation({ variables: { id: conPort.id, slug: e.target.value } }).then(({ data }) => console.log("got data ", data));
                                                }
                                            }} />
                                    </div>
                                )) : ""}
                            </div>
                            <div className="col-sm-6">
                                <h5>Cpu ports</h5>
                                {this.props.matrix.cpuPorts ? this.props.matrix.cpuPorts.map((cpuPort, index) => (
                                    <div>
                                        {`${index+1}. `}
                                        <input key={cpuPort.id} type="text" className="form-control" value={this.state.cpuPorts[cpuPort.id]}
                                            onChange={e => {
                                                this.state.cpuPorts[cpuPort.id] = e.target.value;
                                                this.forceUpdate();
                                            }}
                                            onBlur={e => {
                                                this.props.editCpuPortMutation({ variables: { id: cpuPort.id, slug: e.target.value } }).then(({ data }) => console.log("got data ", data));
                                            }}
                                            onKeyPress={e => {
                                                if (e.key === "Enter") {
                                                    this.props.editCpuPortMutation({ variables: { id: cpuPort.id, slug: e.target.value } }).then(({ data }) => console.log("got data ", data));
                                                }
                                            }} />
                                    </div>
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


export default compose(
	graphql(gql`
	query matrixBySlug($slug: String!) {
    	matrix: matrixBySlug(slug: $slug) {
        	id
        	slug
        	ip
        	port
        	conPorts {
        	    id
        	    slug
        	    portNum
        	}
        	cpuPorts {
        	    id
        	    slug
        	    portNum
        	}
    	}
	}`, {
		options: (ownProps) => {
			return {
				variables: {
					slug: ownProps.params.slug
				}
			}
		},
		props: ({ ownProps, data: { matrix } }) => ({
			matrix
		})
	}),
	graphql(gql`
	mutation editMatrix($id: String!, $slug: String, $ip: String, $port: Int) {
    	editMatrix(id: $id, slug: $slug, ip: $ip, port: $port) {
     	   slug
    	}
	}`, { name: "editMatrixMutation" }),
	graphql(gql`
	mutation ediConPort($id: String!, $slug: String){
    	editConPort(id: $id, slug: $slug) {
        	id
        	slug
    	}
	}`, { name: "editConPortMutation" }),
	graphql(gql`
	mutation editCpuPort($id: String!, $slug: String){
    	editCpuPort(id: $id, slug: $slug) {
        	id
        	slug
    	}
	}`, { name: "editCpuPortMutation" }),
    graphql(gql`
    mutation removeMatrix($id: String!) {
        removeMatrix(id: $id)
    }`, {
		props: ({ownProps, mutate}) => ({
			removeMatrix({id}) {
				return mutate({
					variables: {
						id
					},
					updateQueries: {
						matrixs: (prev, { mutationResult }) => {
							return Object.assign({}, prev, {
								matrixs: prev.matrixs.filter(p => p.id !== mutationResult.data.matrix.id)
							});
						} 
					}
				})
			}
		})
	})
)(MatrixSettings);