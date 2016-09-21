import React from 'react';

var Button = require('react-bootstrap').Button;
var Link = require('react-router').Link;
var Col = require('react-bootstrap').Col;

var PageLayout = require('./PageLayout');

class Matrix extends React.Component {
    handleSave() {

    }

    handleRemove() {

    }

    render() {

        var cpuPorts = ["tykitys1", "tykitys2", "atem multiview", "atem program", "Normi Stream"];
        var conPorts = ["Tykkipiste1", "tykkipiste2", "tykkipisti3", "tykkipiste4"];

        var cpuRows = [];
        var conRows = [];

        var x = 1;
        cpuPorts.forEach(function (cpuPort) {
            cpuRows.push(<div>{x} <input value={cpuPort} /></div>);
            x++;
        });
        x = 1;
        conPorts.forEach(function (conPort) {
            conRows.push(<div>{x} <input value={conPort} /></div>);
            x++;
        });

        return (
            <PageLayout>
                <form>
                    <input className="form-control" type="text" placeholder="Ip" required pattern="^([0-9]{1,3}\.){3}[0-9]{1,3}$" />
                    <input className="form-control" type="number" step="1" placeholder="Portti" min="1" />
                    <div style={{ whiteSpace: "nowrap", width: "100%" }}>
                        <div style={{ display: "inline-table" }}>
                            <h4>Cpu portit</h4>
                            {cpuRows}
                        </div>
                        <div style={{ marginLeft: "30px", width: "100%", display: "inline-table" }}>
                            <h4>Con portit</h4>
                            {conRows}
                        </div>
                    </div>
                    <div>
                        <Button onClick={this.handleSave.bind(this) } style={{ width: "50%" }}>
                            Tallenna
                        </Button>
                        <Button onClick={this.handleRemove.bind(this) } style={{ width: "50%" }}>
                            Poista
                        </Button>
                    </div>
                </form>
            </PageLayout>
        )
    }
}


class CpuPorts extends React.Component {

    render() {
        return (
            <div>
            </div>
        )
    }
}

class ConPorts extends React.Component {
    render() {
        return (
            <div>
            </div>
        )
    }
}

class Cpu extends React.Component {
    render() {
        return (
            <div>
            </div>
        )
    }
}

class Con extends React.Component {
    render() {
        return (
            <div>
            </div>
        )
    }
}

module.exports = Matrix;