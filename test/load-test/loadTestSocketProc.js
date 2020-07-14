/* eslint-disable */
const TEST_CST = require("./TEST_CST");
const dotenv = require("dotenv");
const path = require("path");

// Load the environment config from .env file
dotenv.config({
  path: path.join(__dirname, "/../../config/.env"),
});

module.exports = {
  initVariables,
};

// Send the test key to the server so it aknowledges a proper test
function initVariables(context, _events, next) {
  context.vars.connectionEvent = TEST_CST.CONNECT;
  context.vars.connectPayload = {
    testKey: process.env.TEST_KEY,
    sessCookie: context.vars.sessCookie,
  };

  // Tell the server the game has "loaded"
  context.vars.loadedEvent = TEST_CST.GAME_LOADED;

  next();
}
