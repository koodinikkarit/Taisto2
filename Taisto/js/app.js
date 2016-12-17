import ReactDOM from 'react-dom';
import React from 'react';
import {
    Router,
    Route,
    hashHistory,
    browserHistory
} from 'react-router';
import { Provider } from 'react-redux'

import {
    CustomDiagram,
    Etusivu,
    Promode,
    Settings
} from "./containers/";

import store from "./store";

console.log(Promode);

ReactDOM.render(
    <Provider store={store}>
        <Router history={hashHistory}>
            <Route history={hashHistory} path="/" component={Etusivu} />
            <Route history={hashHistory} path="/diagram" component={CustomDiagram} />
            <Route history={hashHistory} path="/promode" component={Promode} />
            <Route history={hashHistory} path="/settings" component={Settings} />
        </Router>
    </Provider>,
    document.getElementById('root')
);