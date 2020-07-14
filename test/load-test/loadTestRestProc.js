/* eslint-disable */
const WRITE_USERS_TO_FILE = false;

let fs, cookie, fsPromises;

if (WRITE_USERS_TO_FILE) {
  fs = require("fs");
  cookie = require("cookie");
  fsPromises = fs.promises;
}

module.exports = {
  populateEmail,
  loginResponse,
};

// Generate a random value for the email and keep it in the variables
function populateEmail(context, _events, next) {
  context.vars.email = genRandStr();

  next();
}

// After sending a post request to login the new user, call back to this function
async function loginResponse(requestParams, response, context, ee, next) {
  // expect login to be successful
  if (!context.vars.loginSuccess) {
    return next();
  }

  if (WRITE_USERS_TO_FILE) {
    // Parse the received session id cookie
    let parsedCookies = cookie.parse(response.request.headers.cookie);
    // And save it to file so we can use it later to load test socket.io
    await fsPromises.appendFile("./users.csv", parsedCookies.sessId + "\n");
  }

  next();
}

// Utility used to generate random strings
function genRandStr() {
  const charas =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";
  const LENGTH = 25;
  let genStr = "";

  for (let i = 0; i < LENGTH; i++) {
    genStr = genStr + charas[Math.floor(Math.random() * (charas.length - 1))];
  }

  return genStr;
}
