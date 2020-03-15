let webpackBaseCfg = require("./webpack-base.config");

webpackBaseCfg.devServer = {
  contentBase: "../public/",
  writeToDisk: true,
  index: "",
  host: "localhost",
  port: 3000, // Defaults to 8080
  // redirect requests to the node server
  proxy: {
    context: () => true,
    target: "http://localhost:8080",
    secure: false
  }
};

module.exports = webpackBaseCfg;
