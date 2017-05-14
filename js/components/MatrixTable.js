import React from 'react';
import ReactDOM from 'react-dom';
import Measure from 'react-measure';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            containerWidth: 0,
            conTableWidth: 0
        };
    }

    checkForConnection() {

    }

    render() {
        var that = this;
        if (this.props.conPorts && this.props.cpuPorts) {
            var styles = {
                divContainer: {
                    //minWidth: "100px",
                    whiteSpace: "nowrap",
                    width: "100%"
                },
                conTable: {
                    display: "inline-block",
                },
                cpuTable: {
                    table: {
                        display: "inline-block",
                        overflowX: "auto",
                        width: this.state.containerWidth-this.state.conTableWidth
                    },
                    head: {
                        //width: "100%"
                    },
                    body: {
                        //width: "100%"
                    }
                },
                matrixRow: {
                    height: "50px"
                },
                matrixCpuColumn: {
                    border: "solid white 1px",
                    backgroundColor: "#EEE"                
                },
                matrixColumnHeader: {
                    border: "solid white 1px",
                    backgroundColor: "#EEE",
                    minWidth: "70px",
                },
                matrixColumn: {
                    border: "solid white 1px",
                    backgroundColor: "rgb(179, 229, 220)",
                    cursor: "pointer"
                }
            }
            var videoConnectionColor = "rgb(244, 158, 66)";
            var kwmConnectionColor = "red";
            var videoConnectionAndKwmConnectionColor = "rgb(0, 153, 0)";

            return (
                <Measure style={{ width: "100%" }} onMeasure={(dimensions) => this.setState({ containerWidth: dimensions.width })}>
                    <div style={styles.divContainer}>
                        <Measure onMeasure={(dimensions) => this.setState({ conTableWidth: dimensions.width })}>
                            <table style={styles.conTable}>
                                <tbody>
                                    <tr style={styles.matrixRow}><th style={styles.matrixCpuColumn}></th></tr>
                                    {this.props.conPorts.map(conPort => (
                                        <tr style={styles.matrixRow}><th style={styles.matrixCpuColumn}>{conPort.portNum + ". "}{conPort.slug}</th></tr>
                                    ))}
                                </tbody>
                            </table>
                        </Measure>
                        <table style={styles.cpuTable.table}>
                            <thead style={styles.cpuTable.head}>
                                <tr style={styles.matrixRow}>
                                    {this.props.cpuPorts.map(cpuPort => (
                                        <th style={styles.matrixColumnHeader}>{cpuPort.portNum + ". "}{cpuPort.slug}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody style={styles.cpuTable.body}>
                                {this.props.conPorts.map(conPort => (
                                    <tr style={styles.matrixRow}>
                                        {this.props.cpuPorts.map(cpuPort => {
                                            var videoConnectionPort = this.props.videoConnections ? this.props.videoConnections[conPort.id] : null;
                                            var kwmConnectionPort = this.props.kwmConnections ? this.props.kwmConnections[cpuPort.id] : null;
                                            var newStyle;
                                            var leftClickAction;
                                            var rightClickAction;
                                            if (videoConnectionPort === cpuPort.id && kwmConnectionPort === conPort.id) {
                                                 newStyle = {...styles.matrixColumn, backgroundColor: videoConnectionAndKwmConnectionColor};
                                                 leftClickAction = () => {
                                                    if (this.props.onTurnOffVideoConnection) this.props.onTurnOffVideoConnection(conPort.id);
                                                 };
                                                 rightClickAction = () => {
                                                     if (this.props.onTurnOffKwmConnection) this.props.onTurnOffKwmConnection(cpuPort.id);
                                                 }
                                            } else if (videoConnectionPort === cpuPort.id) {
                                                  newStyle = {...styles.matrixColumn, backgroundColor: videoConnectionColor};
                                                  leftClickAction = () => {
                                                      if (this.props.onTurnOffVideoConnection) this.props.onTurnOffVideoConnection(conPort.id);
                                                  };
                                                  rightClickAction = () => {
                                                      if (this.props.onNewKwmConnection) this.props.onNewKwmConnection(conPort.id, cpuPort.id);
                                                  };

                                            } else if (kwmConnectionPort === conPort.id) {
                                                newStyle = { ...styles.matrixColumn, backgroundColor: kwmConnectionColor };
                                                leftClickAction = () => {
                                                    if (this.props.onNewVideoConnection) this.props.onNewVideoConnection(conPort.id, cpuPort.id);
                                                };
                                                rightClickAction = () => {
                                                    if (this.props.onTurnOffKwmConnection) this.props.onTurnOffKwmConnection(cpuPort.id);
                                                };
                                            } else {
                                                newStyle = styles.matrixColumn;
                                                leftClickAction = () => {
                                                    if (this.props.onNewVideoConnection) this.props.onNewVideoConnection(conPort.id, cpuPort.id);
                                                };
                                                rightClickAction = () => {
                                                    if (this.props.onNewKwmConnection) this.props.onNewKwmConnection(conPort.id, cpuPort.id);
                                                };
                                            }
                                            return <td style={newStyle} title={`${cpuPort.portNum}. ${cpuPort.slug} => ${conPort.portNum}. ${conPort.slug}`} onClick={(e) => {
                                                e.stopPropagation();
												e.preventDefault();
												leftClickAction();
                                            }} onContextMenu={e => {
                                                e.stopPropagation();
												e.preventDefault();
												rightClickAction();
											}}></td>
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Measure>
            )
        } else {
            return <h1>Virheelliset parametrit</h1>
        }
    }

}



        //var cpuLenght = (this.props.containerWidth / (this.props.cpus.length+1)) - 15 + "px";
        // var cpuLenght = 100 / this.props.cpus.length + "%";
        // var conHeight = "50px";
        // var conLenght = this.props.containerHeight / this.props.cons.lenght;
        // var minButtonWidth = "90px";
        // var minButtonHeight = "50px";
        // var maxButtonWidth = "140px";
        // var table1MinWidth = 100;
        // var table1Width = this.props.containerWidth / (this.props.cpus.length + 1);
        // if (table1Width < table1MinWidth) {
        //     table1Width = table1MinWidth;
        // }
        // var table2MinWidth = 90 * this.props.cpus;
        // var table2Width = this.props.containerWidth - table1Width;
        // var table2Width = table2Width - 1;


                // <div style={{ width: table1Width, float: "left" }}>
                //     <table>
                //         <tbody>
                //             <tr style={{ maxWidth: "50px", height: "50px" }}></tr>
                //             {
                //                 this.props.cons.map(con => {
                //                     return (<tr key={con.id} style={{ height: "50px" }}><th>{con.name}</th></tr>);
                //                 })
                //             }
                //         </tbody>
                //     </table>
                // </div>
                // <div style={{ width: table2Width, float: "left", overflowX: "auto" }}>
                //     <table style={{ width: table2Width }}>
                //         <tbody>
                //             <tr style={{ height: conHeight, minWidth: minButtonWidth, maxWidth: maxButtonWidth }}>
                //                 {this.props.cpus.map(cpu => {
                //                     return (<td key={cpu.id} style={
                //                         {
                //                             minHeight: minButtonHeight,
                //                             minWidth: minButtonWidth,
                //                             maxWidth: maxButtonWidth,
                //                             width: cpuLenght
                //                         }}>{cpu.name}</td>);
                //                 })}
                //             </tr>
                //             {this.props.cons.map((con, index) => {
                //                 return (
                //                     <tr key={con.id}>
                //                         {this.props.cpus.map((cpu, index) => {
                //                             return (<td key={cpu.id} style={
                //                                 {
                //                                     minHeight: minButtonHeight,
                //                                     minWidth: minButtonWidth,
                //                                     maxWidth: maxButtonWidth,
                //                                     width: cpuLenght,
                //                                     border: "solid white 1px",
                //                                     backgroundColor: (con.value == index) ? "red" : "rgb(179, 229, 220)",
                //                                     height: "50px"
                //                                 }} onClick={() => { if (that.props.onVideoConnectionChange) that.props.onVideoConnectionChange(cpu.id, index); } }></td>);
                //                         })}
                //                     </tr>
                //                 );
                //             })}
                //         </tbody>
                //     </table>
                // </div>



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