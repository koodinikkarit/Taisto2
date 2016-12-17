import React from 'react';
import ReactDOM from 'react-dom';
import MeasureIt from 'react-measure-it'

function getWidth(element) {
    return ReactDOM.findDOMNode(element).parentNode.getBoundingClientRect().width
}

function getHeight(element) {
    return ReactDOM.findDOMNode(element).parentNode.getBoundingClientRect().height
}

export default
MeasureIt({ getWidth, getHeight })(class extends React.Component {
        render() {
            var buttonHeight = "60px";
        return (
            <div style={{ padding: "10%" }}>
                <h3>Kappa</h3>
                <div>
                    {this.props.links.map(link => {
                        return <button style={{ height: buttonHeight, width: "100%", marginBottom: "2px" }}>Yläsali</button>
                    })
                    }        
                </div>
                <div>
                <a href="#/promode" style={{ height: buttonHeight, width: "32%", marginRight: "2%", fontSize: "30px" }}>
                    Promode
                </a>
                <a href="#" style={{ height: buttonHeight, width: "32%" }}>
                    Taulu
                </a>
                <a href="#" style={{ height: buttonHeight, width: "32%", marginLeft: "2%" }}>
                    Valikko
                </a>
                </div>
            </div>       
        );
    }
});