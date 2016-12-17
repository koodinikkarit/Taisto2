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
            return (
                <div>

                </div>
            );
        }
    });