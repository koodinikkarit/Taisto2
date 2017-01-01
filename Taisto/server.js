const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');
const express = require('express');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const path = require('path');
const graphQLHTTP = require('express-graphql');
const schema = require("./backend/graphql/RootTypes");

// Routes
const index = require("./routes/");

//import {schema} from './data/schema';
const app = express();

var port;
var development = false;

console.log(process.argv);

process.argv.forEach(function (arg, index) {
    if (arg === "--p") {
        port = process.argv[index+1];
    }
    if (arg === "--d") {
        development = true;
    }
});

const APP_PORT = 3000;

app.use(index);

// app.get("/api", function (req,res) {
//     res.end("Tämä on api");
// });

// app.get("/", function (req, res) {
//     res.end(
// `
// <html>
//     <head>
//         <title>Taisto</title>
//     </head>
//     <body>
//         <div id="root"></div>
//         <script src="/js/app.js"></script>
//         <script src="/webpack-dev-server.js"></script>
//     </body>
// </html>
// `);
// });

if (development) {
    const compiler = webpack({
        devtool: 'eval',
        entry: {
            app: path.resolve(__dirname, 'js', 'app.js'),
            //main: "./debugIndex.js"
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
            path: '/',
            libraryTarget: 'umd'
        },
        // plugins: [
        //     new StaticSiteGeneratorPlugin('main', [
        //         "/",
        //         "/diagram/*",
        //         "/promode/index.html",
        //         "/settings/index.html",
        //     ], { })
        // ]
    });

    const webPackApp = new WebpackDevServer(compiler, {
        historyApiFallback: false,
        contentBase: '/public/',
        publicPath: '/js/'
     });
    webPackApp.use("/api", graphQLHTTP({
        schema, graphiql: true, pretty: true
    }))
    webPackApp.use("/", app);

    webPackApp.listen(APP_PORT, () => {
        console.log("server running");
    });
} else {

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

