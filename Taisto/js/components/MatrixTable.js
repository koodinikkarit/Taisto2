import React from 'react';
import ReactDOM from 'react-dom';

export default class extends React.Component {
    render() {
        var that = this;
        //var cpuLenght = (this.props.containerWidth / (this.props.cpus.length+1)) - 15 + "px";
        var cpuLenght = 100 / this.props.cpus.length + "%";
        var conHeight = "50px";
        var conLenght = this.props.containerHeight / this.props.cons.lenght;
        var minButtonWidth = "90px";
        var minButtonHeight = "50px";
        var maxButtonWidth = "140px";
        var table1MinWidth = 100;
        var table1Width = this.props.containerWidth / (this.props.cpus.length + 1);
        if (table1Width < table1MinWidth) {
            table1Width = table1MinWidth;
        }
        var table2MinWidth = 90 * this.props.cpus;
        var table2Width = this.props.containerWidth - table1Width;
        var table2Width = table2Width - 1;


        return (
            <div>
                <div style={{ width: table1Width, float: "left" }}>
                    <table>
                        <tbody>
                            <tr style={{ maxWidth: "50px", height: "50px" }}></tr>
                            {
                                this.props.cons.map(con => {
                                    return (<tr key={con.id} style={{ height: "50px" }}><th>{con.name}</th></tr>);
                                })
                            }
                        </tbody>
                    </table>
                </div>
                <div style={{ width: table2Width, float: "left", overflowX: "auto" }}>
                    <table style={{ width: table2Width }}>
                        <tbody>
                            <tr style={{ height: conHeight, minWidth: minButtonWidth, maxWidth: maxButtonWidth }}>
                                {this.props.cpus.map(cpu => {
                                    return (<td key={cpu.id} style={
                                        {
                                            minHeight: minButtonHeight,
                                            minWidth: minButtonWidth,
                                            maxWidth: maxButtonWidth,
                                            width: cpuLenght
                                        }}>{cpu.name}</td>);
                                })}
                            </tr>
                            {this.props.cons.map((con, index) => {
                                return (
                                    <tr key={con.id}>
                                        {this.props.cpus.map((cpu, index) => {
                                            return (<td key={cpu.id} style={
                                                {
                                                    minHeight: minButtonHeight,
                                                    minWidth: minButtonWidth,
                                                    maxWidth: maxButtonWidth,
                                                    width: cpuLenght,
                                                    border: "solid white 1px",
                                                    backgroundColor: (con.value == index) ? "red" : "rgb(179, 229, 220)",
                                                    height: "50px"
                                                }} onClick={() => { if (that.props.onVideoConnectionChange) that.props.onVideoConnectionChange(cpu.id, index); } }></td>);
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

            </div>
        )
    }

}



//<table>
//    <thead>
//        <tr style={{ height: conHeight, minWidth: minButtonWidth, maxWidth: maxButtonWidth }}>
//            <th></th>
//            {this.props.cpus.map(cpu => {
//                return (<th>{cpu}</th>);
//            }) }
//        </tr>
//    </thead>
//    <tbody>
//        {this.props.cons.map(con => {
//            return (
//                <tr style={{ height: conHeight, minWidth: minButtonWidth, maxWidth: maxButtonWidth }}>
//                    <th style={{ width: cpuLenght }}>{con}</th>
//                    {this.props.cpus.map(cpu => {
//                        return (
//                            <td style={
//                                {
//                                    minHeight: minButtonHeight,
//                                    minWidth: minButtonWidth,
//                                    maxWidth: maxButtonWidth,
//                                    width: cpuLenght,
//                                    border: "solid 1px black"
//                                }}></td>
//                        )
//                    }) }
//                </tr>);
//        }) }

//    </tbody>
//</table>