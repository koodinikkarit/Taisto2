import ReactDOM from 'react-dom';
import React from 'react';
import {
    Router,
    Route,
    browserHistory
} from 'react-router';
import { Provider } from 'react-redux'
import ApolloClient from 'apollo-client';
import { ApolloProvider } from 'react-apollo';

import routes from "./routes";

import store from "./store";

import client from "./client";

ReactDOM.render(
    <ApolloProvider client={client}>
        <Router history={browserHistory} routes={routes} />
    </ApolloProvider>,
    document.getElementById('root')
);