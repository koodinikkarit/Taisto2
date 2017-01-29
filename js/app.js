import ReactDOM from 'react-dom';
import React from 'react';
import {
    Router,
    browserHistory
} from 'react-router';
import { ApolloProvider } from 'react-apollo';

import store from "./store";
import client from "./client";


import routes from "./routes";

ReactDOM.render(
    <ApolloProvider store={store} client={client}>
        <Router history={browserHistory} routes={routes} />
    </ApolloProvider>,
    document.getElementById('root')
);