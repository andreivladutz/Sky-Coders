/* eslint-disable no-undef */
const path = require("path");
const nodeExternals = require("webpack-node-externals");
const WebpackShellPlugin = require("webpack-shell-plugin");

const { NODE_ENV = "development" } = process.env;

// relative path to server
const PATH_TO_SERVER = "../../server/";

module.exports = {
  entry: "./server/index.ts",
  mode: NODE_ENV,
  // enable file watching if the mode is development
  watch: NODE_ENV === "development",
  target: "node",
  node: {
    __dirname: false,
    __filename: false
  },
  // compile typescript files
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ["ts-loader"]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, PATH_TO_SERVER + "build"),
    filename: "index.js"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  // this will run nodemon after building successfully
  plugins: [
    new WebpackShellPlugin({
      onBuildEnd: ["npm run dev-nodemon"]
    })
  ],
  // don't add node modules to the build file
  externals: [nodeExternals()]
};
