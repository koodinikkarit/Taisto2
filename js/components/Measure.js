import React from "react";

// Small React 18-compatible replacement for the unmaintained react-measure v1.
export default class Measure extends React.Component {
    constructor(props) {
        super(props);
        this.node = null;
        this.resizeObserver = null;
    }

    componentDidMount() {
        this.resizeObserver = new ResizeObserver(() => this.measure());
        if (this.node) {
            this.resizeObserver.observe(this.node);
            this.measure();
        }
    }

    componentWillUnmount() {
        if (this.resizeObserver) this.resizeObserver.disconnect();
    }

    setNode = node => {
        this.node = node;
    };

    measure() {
        if (this.node && this.props.onMeasure) {
            const { width, height, top, right, bottom, left } = this.node.getBoundingClientRect();
            this.props.onMeasure({ width, height, top, right, bottom, left });
        }
    }

    render() {
        const child = React.Children.only(this.props.children);
        const style = this.props.style ? { ...child.props.style, ...this.props.style } : child.props.style;

        return React.cloneElement(child, { ref: this.setNode, style });
    }
}
