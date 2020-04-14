import * as express from "express";
import * as expressLayouts from "express-ejs-layouts";
import flash from "connect-flash";
import * as session from "express-session";
import * as passport from "passport";

import configurePassport from "./authentication/configurePassport";
import authenticate from "./authentication/authenticateMiddleware";

import authRouter from "./routes/authRouter";
import gameRouter from "./routes/gameRouter";
import CST from "./SERVER_CST";

import * as mongoose from "mongoose";
import * as dotenv from "dotenv";

import * as path from "path";

// Load the environment config from .env file
let { parsed: dotenvCfg } = dotenv.config({
  path: path.join(__dirname, "/../../config/.env"),
  debug: true
});

mongoose.connect(dotenvCfg.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const PORT = process.env.PORT || 8080;

// Add the local strategy and serialization / deserialization to passport
configurePassport(passport);

let app = express();

// Set the ejs view engine
app.set("view engine", "ejs");
app.use(expressLayouts);

// Express session middleware
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true
  })
);

// Use passport middleware for auth
app.use(passport.initialize());
app.use(passport.session());

// Connect flash for temporary data
// Useful for sending messages to the client when redirecting
app.use(flash());

// Temporary messages stored with flash
// Pass them to locals so ejs can render the messages on the page
app.use((req, res, next) => {
  // Temp messages coming from the /users/register route
  res.locals[CST.TEMP_MSG.SUCCESS] = req.flash(CST.TEMP_MSG.SUCCESS);
  res.locals[CST.TEMP_MSG.ERROR] = req.flash(CST.TEMP_MSG.ERROR);

  // The flash error message coming from passport
  res.locals[CST.TEMP_MSG.ERROR] = req.flash(CST.TEMP_MSG.PASSPORT_ERR);

  next();
});

app
  .get(CST.WEB_MANIFEST, (req, res) => {
    res.sendFile(path.join(__dirname, CST.MANIFEST_FILE));
  })
  // the login / register path
  .use("/users", authRouter)
  // authenticated game route
  .use(authenticate, gameRouter)
  // static files that do not require authentication
  //.use("/no_auth", express.static(CST.PUBLIC_FOLDER))
  .listen(PORT, () => {
    console.log(`App listening on ${PORT}.`);
  });
