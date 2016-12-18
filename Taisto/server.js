import express from 'express';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import path from 'path';
import graphQLHTTP from 'express-graphql';
//import {schema} from './data/schema';

var bodyParser = require('body-parser');

const APP_PORT = 3000;


//const graphQLServer = express();
//graphQLServer.use('/api', graphQLHTTP({ schema, graphiql: true, pretty: true }));

const compiler = webpack({
    devtool: 'eval',
    entry: path.resolve(__dirname, 'js', 'app.js'),
    module: {
        loaders: [
            {
                exclude: /node_modules/,
                loader: 'babel',
                test: /\.js$/,
            },
        ],
    },
    output: { filename: 'app.js', path: '/' }
});

const app = express();

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.get("/*", function (req, res) {
    res.sendFile(__dirname + "/public/" + '/index.html');
});


const webPackApp = new WebpackDevServer(compiler, {
    contentBase: '/public/',
    publicPath: '/js/'
});

//webPackApp.use('/*', express.static(path.resolve(__dirname, 'public') + "/index.html"));

webPackApp.use("/", app);

//webPackApp.use("/api", graphQLHTTP({
//    schema, graphiql: true, pretty: true
//}));

webPackApp.listen(APP_PORT, () => {
    console.log("server running");
});