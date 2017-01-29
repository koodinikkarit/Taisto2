const express = require('express');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
var webpackMiddleware = require("webpack-dev-middleware");
const path = require('path');
const graphQLHTTP = require('express-graphql');

const React = require('react');

import schema from "./backend/graphql/RootTypes";

import PageFrame from "./js/components/PageFrame";
import ReactDOMServer from "react-dom/server";
const graphql = require('graphql');
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import {createLocalInterface} from 'apollo-local-query';
import { 
    ApolloProvider, 
    renderToStringWithData 
} from 'react-apollo';
import { match, RouterContext } from 'react-router';

import {
    SET_VIDEO_CONNECTION,
    SET_KWM_CONNECTION,
    NEW_VIDEO_CONNECTION,
    NEW_KWM_CONNECTION,
    TURN_OFF_VIDEO_CONNECTION,
    TURN_OFF_KWM_CONNECTION,
    VIDEO_CONNECTION_TURN_OFF,
    KWM_CONNECTION_TURN_OFF,
    NEW_VIDEO_CONNECTIONS,
    NEW_KWM_CONNECTIONS
} from "./js/constants/actionconstants";

import {
    setVideoConnection,
    setKwmConnection,
    turnOffVideoConnection,
    turnOffKwmConnection,
    getVideoConnections,
    getKwmConnections
} from "./backend/MatrixManager";

import routes from "./js/routes";

var app = express();  

var port;
var development = false;

process.argv.forEach(function (arg, index) {
    if (arg === "-p") {
        port = process.argv[index + 1];
    }
    if (arg === "-d") {
        development = true;
    }
});

const APP_PORT = 3000;

app.use('/static', express.static('public'));

if (development) {
    app.use("/api", graphQLHTTP({
        schema, graphiql: true, pretty: true
    }))

    app.use(webpackMiddleware(webpack({
        devtool: 'eval',
        entry: {
            app: path.resolve(__dirname, 'js', 'app.js'),
        },
        module: {
            loaders: [
                {
                    exclude: /node_modules/,
                    loader: 'babel',
                    test: /\.js$/,
                },
            ],
        },
        output: {
            filename: '[name].js',
            path: '/'
        }
    }), {
        contentBase: './public/',
        publicPath: '/js/',
        stats: "errors-only"
     }));
     ssr();
} else {
    const compiler = webpack({
        devtool: "cheap-module-source-map",
        entry: {
            app: path.resolve(__dirname, 'js', 'app.js'),
        },
        module: {
            loaders: [
                {
                    exclude: /node_modules/,
                    loader: 'babel',
                    test: /\.js$/,
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            })
        ],
        output: {
            filename: '[name].js',
            path: './public/'
        }
    });

     compiler.run(function (err, stats) {
         app.use("/api", graphQLHTTP({
             schema, graphiql: false, pretty: false
         }))
         app.get("/js/app.js", function (req, res, next) {
             res.sendFile(__dirname + '/public/app.js');
         });
         ssr();
     });
}

function ssr() {
    app.use((req, res) => {
        match({ routes, location: req.originalUrl }, (error, redirectLocation, renderProps) => {
            const client = new ApolloClient({
                ssrMode: true,
                // Remember that this is the interface the SSR server will use to connect to the
                // API server, so we need to ensure it isn't firewalled, etc
                networkInterface: createLocalInterface(graphql, schema),
            });
            const app = (
                <ApolloProvider client={client}>
                    <RouterContext {...renderProps} />
                </ApolloProvider>
            );


            renderToStringWithData(app).then((content) => {
                const initialState = {
                    [client.reduxRootKey]: {
                        data: client.store.getState()[client.reduxRootKey].data
                    }
                };

                res.status(200);
                res.send(`<!doctype html>\n${ReactDOMServer.renderToString(<PageFrame content={content} state={initialState} />)}`);
                res.end();
            });
        })
    });
}

var server = app.listen(port || APP_PORT, () => {
    console.log("serveri on käynnissä");
});

var io = require('socket.io')(server);

io.on("connection", function (socket) {
    io.emit(NEW_VIDEO_CONNECTIONS, getVideoConnections());
    io.emit(NEW_KWM_CONNECTIONS, getKwmConnections());
    socket.on(SET_VIDEO_CONNECTION, (connection) => {
        setVideoConnection(connection.con, connection.cpu);
        io.emit(NEW_VIDEO_CONNECTION, connection);
    });
    socket.on(SET_KWM_CONNECTION, connection => {
        setKwmConnection(connection.con, connection.cpu);
        io.emit(NEW_KWM_CONNECTION, connection);
    });
    socket.on(TURN_OFF_VIDEO_CONNECTION, connection => {
        turnOffVideoConnection(connection.con);
        io.emit(VIDEO_CONNECTION_TURN_OFF, connection);
    });
    socket.on(TURN_OFF_KWM_CONNECTION, connection => {
        turnOffKwmConnection(connection.cpu);
        io.emit(KWM_CONNECTION_TURN_OFF, connection);
    });
});


