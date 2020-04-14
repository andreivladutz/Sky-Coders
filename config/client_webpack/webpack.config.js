/* eslint-disable no-undef */
const webpack = require("webpack"),
  Terser = require("terser-webpack-plugin"),
  CST = require("./WP_CST");

let webpackBaseCfg = require("./webpack-base.config");

// this config is used for production
webpackBaseCfg.mode = "production";

// add babel
// webpackBaseCfg.module.rules.push({
//   test: /\.js$/,
//   include: CST.PUBLIC_PATH,
//   use: {
//     loader: "babel-loader",
//     options: {
//       presets: ["@babel/preset-env"]
//     }
//   }
// });

// this is used to remove conditionals that are always false
// Use terser instead of the default Uglify since service
// worker code does not need to be transpiled to ES5.
webpackBaseCfg.optimization.minimizer = [
  new Terser({
    // Ensure .mjs files get included.
    test: /\.m?js$/
  })
];
// remove dev-specific code from workbox
webpackBaseCfg.plugins.push(
  new webpack.DefinePlugin({
    "process.env.NODE_ENV": JSON.stringify("production")
  })
);

module.exports = webpackBaseCfg;
