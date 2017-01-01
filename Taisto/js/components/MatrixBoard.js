import React from 'react';
import ReactDOM from 'react-dom';
import MeasureIt from 'react-measure-it'

function getWidth(element) {
    return ReactDOM.findDOMNode(element).parentNode.getBoundingClientRect().width
}

function getHeight(element) {
    return ReactDOM.findDOMNode(element).parentNode.getBoundingClientRect().height
}

var styles = {
    matrixBoard: {

    },
    matrixBoardConList: {

    },
    matrixBoardConListSelect: {
        width: "100%",
        height: "50px"

    },
    matrixBoardCpuList: {
    },
    matrixBoardItem: {

    },
    matrixBoardItemButton: {
        width: "100%",
        height: "50px"
    }
};

export default
    MeasureIt({ getWidth, getHeight })(class extends React.Component {
        render() {
            var that = this;
            return (
                <div>
                    <div style={styles.matrixBoardConList}>
                        <select style={styles.matrixBoardConListSelect}>
                            {this.props.cons.map(con => {
                                return (<option key={con.id}>{con.name}</option>);
                            })}
                        </select>
                    </div>
                    <div style={styles.matrixBoardCpuList}>
                        {this.props.cpus.map((cpu, index) => {
                            return (<div key={cpu.id} style={styles.matrixBoardItem}>
                                <button onClick={() => { if (that.props.onVideoConnectionChange) that.props.onVideoConnectionChange(cpu.id, index); }} style={styles.matrixBoardItemButton}>{cpu.name}</button>
                            </div>);
                        })}
                    </div>
                </div>
            );
        }
    });