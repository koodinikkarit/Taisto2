const path = require("path");
const webpack = require("webpack");

module.exports = {
	devtool: "cheap-module-source-map",
	entry: {
		app: path.resolve(__dirname, "js", "app.js")
	},
	module: {
		loaders: [
			{
				exclude: /node_modules/,
				loader: "babel",
				test: /\.js$/
			}
		]
	},
	plugins: [
		new webpack.DefinePlugin({
			"process.env": {
				NODE_ENV: JSON.stringify("production")
			}
		})
	],
	output: {
		filename: "[name].js",
		path: "./public/"
	}
};
