/* eslint-disable no-undef */
const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

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
  module: {
    rules: [
      {
        test: /\.js$/,
        include: PUBLIC_PATH,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/env"]
          }
        }
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
    new CleanWebpackPlugin({
      root: path.resolve(__dirname, "../")
    }),
    new webpack.DefinePlugin({
      "typeof CANVAS_RENDERER": JSON.stringify(true),
      "typeof WEBGL_RENDERER": JSON.stringify(true)
    })
  ]
};
