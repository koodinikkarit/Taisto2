import React from 'react';

var PageLayout = require('./PageLayout');

class MatrixTables extends React.Component {

    render() {
        return (
            <PageLayout header="Taulukot">
                <MatrixTable/>
            </PageLayout>
        )
    }
}

class MatrixCpuHeader extends React.Component {

    render() {
        var rows = [];

        for (var i = 0; i < 10; i++) {
            rows.push(<div style={{ margin: "10px" }}>aaa</div> )
        }

        return (
            <div style={{ whiteSpace: "no-wrap" }}>
                {rows}
            </div>
        )
    }
}

class MatrixConHeader extends React.Component {

    render() {
        var rows = [];

        for (var i = 0; i < 10; i++) {
            rows.push(<div style={{ margin: "10px" }}>aaa</div>)
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
        return (
            <div>
                <div>
                    <MatrixCpuHeader />
                </div>
                <div>
                    <MatrixConHeader />
                    <MatrixBody />
                </div>
            </div>
        )
    }
}




module.exports = MatrixTables;