import React from 'react';

var Header = require('./Header');
var MainNavigation = require('./MainNavigation.js');
var Footer = require('./Footer');
var Button = require('react-bootstrap').Button;


class PageLayout extends React.Component {

    render() {

        return (
            <div style={{ width: "100%" }}>
                <Header />
                <select className="pull-right">
                    <option>Suomi</option>
                    <option>Englanti</option>
                </select>
                <h5>{this.props.header}</h5>
                <MainNavigation />
                {this.props.children}
                <Footer />
            </div>
        )
    }
}

module.exports = PageLayout;