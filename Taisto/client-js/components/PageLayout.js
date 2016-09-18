import React from 'react';

var Header = require('./Header');
var MainNavigation = require('./MainNavigation.js');
var Footer = require('./Footer');

class PageLayout extends React.Component {

    render() {

        return (
            <div>
                <Header />
                <h5>{this.props.header}</h5>
                <MainNavigation />
                {this.props.children}
                <Footer />
            </div>
        )
    }
}

module.exports = PageLayout;