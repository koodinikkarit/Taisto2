import React from 'react';

export default class extends React.Component {
    render() {
        return (
            <div>
                <h2>{this.props.con.name}</h2>
                <select>
                    {this.props.cpus.map((cpu, index) => {
                        return (<option>{cpu.name}</option>);
                    }) }                    
                </select>
            </div>
        );
    }
}