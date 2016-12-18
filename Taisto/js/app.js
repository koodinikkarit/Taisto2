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
        <Router history={browserHistory}>
            <Route history={browserHistory} path="/" component={Etusivu} />
            <Route history={browserHistory} path="/diagram/:diagramid" component={CustomDiagram} />
            <Route history={browserHistory} path="/promode" component={Promode} />
            <Route history={browserHistory} path="/settings" component={Settings} />
        </Router>
    </Provider>,
    document.getElementById('root')
);