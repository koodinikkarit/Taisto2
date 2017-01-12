import React from 'react';

export default class extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            on: false
        };
    }

    render() {
        var styles = {
            container: {
                cursor: "pointer",
                width: "80px",
                height: "50px"
            },
            slide: {
                position: "absolute",
                borderRadius: "15px",
                width: "70px",
                height: "15px",
                marginTop: "7.5px",
                backgroundColor: this.state.on ? "#609dff" : "#dee0e2" 
            },
            indicator: {
                position: "absolute",
                borderRadius: "15px",
                width: "40px",
                height: "25px",
                marginTop: "1px",
                marginLeft: this.state.on ? "30px" : "0px",
                backgroundColor: this.state.on ? "#8eb9ff" : "#adadad"
            }
        }

        return (
            <div style={styles.container}
            onClick={e => this.setState({ on: !this.state.on })}>
                <div style={styles.slide}></div>
                <div style={styles.indicator}></div>
            </div>
        )
    }
}