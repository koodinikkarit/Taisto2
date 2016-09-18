import ReactDOM from 'react-dom';
import React from 'react';

var Router = require('react-router').Router;
var Route = require('react-router').Route;
var hashHistory = require('react-router').hashHistory;

var MatrixTables = require('./components/MatrixTables');
var MatrixTable = require('./components/MatrixTable');
var MatrixStatuses = require('./components/MatrixStatuses');
var MatrixStatus = require('./components/MatrixStatus');
var MatrixTablesMobiles = require('./components/MatrixTablesMobile');
var Matrixs = require('./components/Matrixs');
var Matrix = require('./components/Matrix');


ReactDOM.render(
    <Router history={hashHistory}>
        <Route history={hashHistory} path="/" component={MatrixTables} />
        <Route history={hashHistory} path="/taulukot" component={MatrixTables} />
        <Route history={hashHistory} path="/talukko/:id" component={MatrixTable} />
        <Route history={hashHistory} path="/valikot" component={MatrixTablesMobiles} />
        <Route history={hashHistory} path="/matriisit" component={Matrixs} />
        <Route history={hashHistory} path="/matriisi/:id" component={Matrix} />
        <Route history={hashHistory} path="/matriisitilat" component={MatrixStatuses} />
        <Route history={hashHistory} path="/matriisitila" component={MatrixStatus} />
    </Router>,
    document.getElementById('root')
);