import React from 'react';

var Table = require('react-bootstrap').Table;
var Col = require('react-bootstrap').Col;

var PageLayout = require('./PageLayout');

class MatrixTables extends React.Component {

    render() {
        var cpuPorts = ["tykitys1", "tykitys2", "atem multiview", "atem program", "Normi Stream"];
        var conPorts = ["Tykkipiste1", "tykkipiste2", "tykkipisti3", "tykkipiste4"];
        return (
            <PageLayout header="Taulukot">
                <MatrixTable Name="Yläsali" CpuPorts={cpuPorts} ConPorts={conPorts} />
                <MatrixTable Name="Alasali" CpuPorts={cpuPorts} ConPorts={conPorts} />
            </PageLayout>
        )
    }
}

class MatrixCpuHeader extends React.Component {

    render() {
        var rows = [];

        for (var i = 0; i < 10; i++) {
            rows.push(<div style={{ margin: "10px", display: "inline-block" }}>aaa</div> )
        }

        return (
            <div style={{  }}>
                {rows}
            </div>
        )
    }
}

class MatrixConHeader extends React.Component {

    render() {
        var rows = [];

        for (var i = 0; i < 10; i++) {
            rows.push(<div style={{ margin: "10px" }}></div>)
        }
        return (
            <div>
                {rows}
            </div>
        )
    }
}

class MatrixBody extends React.Component {

    render() {
        return (
            <div>
            </div>
        )
    }
}


class MatrixTable extends React.Component {

    render() {
        var that = this;
        var rows = [];
        var headerRows = [];
        var bodyRows = [];


        //this.props.CpuPorts.forEach(function (cpuPort) {
        //    headerRows.push(<th>{cpuPort}</th>);
        //});

        //this.props.ConPorts.forEach(function (conPort) {
        //    var buttons = [];
        //    that.props.CpuPorts.forEach(function (cpuPort) {
        //        buttons.push(<td><button style={{width: "100%", height: "35px"}} className="btn btn-success"></button></td>);
        //    });

        //    bodyRows.push(<tr>
        //        <td>{conPort}</td>
        //        {buttons}
        //    </tr>);

        //});
        var tempRows = [];
        this.props.CpuPorts.forEach(function (cpuPort) {
            tempRows.push(<th><div style={{ height: "35px" }}>{cpuPort}</div></th>);
        });

        bodyRows.push(<tr>{tempRows}</tr>);
        headerRows.push(<tr><th><div style={{ height: "35px" }}></div></th></tr>);

        this.props.ConPorts.forEach(function (conPort) {
            var buttons = [];
            for (var i = 0; i < that.props.CpuPorts.length; i++) {
                buttons.push(<td><button style={{ width: "100%", height: "35px" }} className="btn btn-success"></button></td>);
            }
            bodyRows.push(<tr>{buttons}</tr>);
            headerRows.push(<tr><th><div style={{ height: "35px" }}>{conPort}</div></th></tr>);
        });

        return (
            <div>
                <h5>{this.props.Name}</h5>
                <div style={{ whiteSpace: "nowrap", width: "100%" }}>
                    <div style={{ display: "inline-block" }}>
                        <Table responsive>
                            <tbody>
                                {headerRows}
                            </tbody>
                        </Table>
                    </div>
                    <div style={{ display: "inline-block", width: "80%" }}>
                        <Table responsive>
                            <tbody>
                                {bodyRows}
                            </tbody>
                        </Table>
                    </div>  
                </div>
            </div>
        )
    }
}






//<Col xs={2}>
//    <Table responsive>
//        <tbody>
//            {headerRows}
//        </tbody>
//    </Table>
//</Col>
//    <Col xs={10}>
//        <Table responsive>
//            <tbody>
//                {bodyRows}
//            </tbody>
//        </Table>
//    </Col> 


module.exports = MatrixTables;