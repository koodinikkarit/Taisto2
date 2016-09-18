import React from 'react';

var Nav = require('react-bootstrap').Nav;
var NavItem = require('react-bootstrap').NavItem;

class MainNavigation extends React.Component {
    render() {
        return (
            <Nav bsStyle="tabs">
                <NavItem href="/#/taulukot">Taulukot</NavItem>
                <NavItem href="/#/valikot">Valikko</NavItem>
                <NavItem href="/#/matriisit">Matriisit</NavItem>
                <NavItem href="/#/matriisitilat">Tilat</NavItem>
            </Nav>
        )
    }
}

module.exports = MainNavigation;