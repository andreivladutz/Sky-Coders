/* eslint-disable no-undef */
const path = require("path");
const webpack = require("webpack");

const PUBLIC_FOLDER = "public";
const PUBLIC_PATH = path.resolve(__dirname, `../${PUBLIC_FOLDER}`);

module.exports = {
  entry: {
    app: `./${PUBLIC_FOLDER}/game/js/main`
  },
  output: {
    path: PUBLIC_PATH + "/build",
    filename: "app.bundle.js"
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx"]
  },
  mode: "development",
  devServer: {
    contentBase: "./public/",
    writeToDisk: true,
    index: "",
    host: "localhost",
    port: 3000, // Defaults to 8080
    proxy: {
      context: () => true,
      target: "http://localhost:8080",
      secure: false
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: PUBLIC_PATH
        /*use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/env']
              }
            }*/
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: "all"
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      WEBGL_RENDERER: true,
      CANVAS_RENDERER: true
    })
  ]
};
