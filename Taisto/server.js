const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');
const express = require('express');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const path = require('path');
const graphQLHTTP = require('express-graphql');
const schema = require("./backend/graphql/RootTypes");

const app = express();

var port;
var development = false;

process.argv.forEach(function (arg, index) {
    if (arg === "--p") {
        port = process.argv[index+1];
    }
    if (arg === "--d") {
        development = true;
    }
});

const APP_PORT = 3000;

if (development) {
    const develop = require("./routes/develop");
    const compiler = webpack({
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
    });

    const webPackApp = new WebpackDevServer(compiler, {
        historyApiFallback: false,
        contentBase: '/public/',
        publicPath: '/js/'
     });
    webPackApp.use("/api", graphQLHTTP({
        schema, graphiql: true, pretty: true
    }))
    webPackApp.use("/", develop);

    webPackApp.listen(APP_PORT, () => {
        console.log("server running");
    });
} else {
    const production = require("./routes/production");
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
        output: {
            filename: '[name].js',
            path: './public/'
        }

    });

    compiler.run(function (err, stats) {
        app.use("/api", graphQLHTTP({
            schema, graphiql: false, pretty: false
        }))
        app.use("/", production);
        app.get("/app.js", function (req, res, next) {
            res.sendFile(__dirname + '/public/app.js');
        });
        app.listen(port, () => {
            console.log("serveri on käynnissä");
        });
    });
}


// var bodyParser = require('body-parser');




//const graphQLServer = express();
//graphQLServer.use('/api', graphQLHTTP({ schema, graphiql: true, pretty: true }));



// const app = express();

// app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
//     extended: true
// }));

// app.get("/*", function (req, res) {
//     res.sendFile(__dirname + "/public/" + '/index.html');
// });




//webPackApp.use('/*', express.static(path.resolve(__dirname, 'public') + "/index.html"));

