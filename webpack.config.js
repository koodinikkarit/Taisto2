const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "production",
  devtool: "cheap-module-source-map",
  entry: {
    app: path.resolve(__dirname, "js", "app.js")
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production")
    })
  ],
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "public"),
    publicPath: "/js/"
  }
};
