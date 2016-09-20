import React from 'react';

var ListGroup = require('react-bootstrap').ListGroup;
var ListGroupItem = require('react-bootstrap').ListGroupItem;
var Button = require('react-bootstrap').Button;

var PageLayout = require('./PageLayout');

class MatrixTableMobile extends React.Component {
    render() {
        var cpuPorts = ["tykitys1", "tykitys2", "atem multiview", "atem program", "Normi Stream"];
        var conPorts = ["Tykkipiste1", "tykkipiste2", "tykkipisti3", "tykkipiste4"];

        return (
            <PageLayout header="Valikot">

                <MatrixMenu CpuPorts={cpuPorts} ConPorts={conPorts} />
                <MatrixMenu CpuPorts={cpuPorts} ConPorts={conPorts} />
                <MatrixMenu CpuPorts={cpuPorts} ConPorts={conPorts} />
            </PageLayout>
        )
    }
}

class MatrixMenu extends React.Component {
    render() {
        var that = this;
        var optionRows = [];
        var buttonRows = [];

        this.props.ConPorts.forEach(function (conPort) {
            optionRows.push(<option>{conPort}</option>);
        });

        this.props.CpuPorts.forEach(function (cpuPort) {
            buttonRows.push(<ListGroupItem style={{ padding: "0px" }}><Button style={{ width: "100%", borderBottomLeftRadius: "0px" }}>{cpuPort}</Button></ListGroupItem>);
        });

        return (

            <div>
                <select style={{ width: "100%", fontSize: "30px", height: "50px" }}>
                    {optionRows}
                </select>
                <ListGroup>
                    {buttonRows}
                </ListGroup>
            </div>
        )
    }
}

module.exports = MatrixTableMobile;