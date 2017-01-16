import React from 'react';

export default class extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            on: false
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            on: nextProps.on ? nextProps.on : false
        });
    }

    render() {
        var on = this.props.on ? this.props.on : false;
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
                marginTop: "6px",
                backgroundColor: on ? "#609dff" : "#dee0e2" 
            },
            indicator: {
                position: "absolute",
                borderRadius: "15px",
                width: "40px",
                height: "25px",
                marginTop: "1px",
                marginLeft: on ? "30px" : "0px",
                backgroundColor: on ? "#8eb9ff" : "#adadad"
            }
        }

        return (
            <div style={styles.container}
            onClick={e => {
                e.stopPropagation();
                if (this.props.onSwitch) this.props.onSwitch(!this.state.on);
                this.setState({ on: !this.state.on });           
            }}>
                <div style={styles.slide}></div>
                <div style={styles.indicator}></div>
            </div>
        )
    }
}