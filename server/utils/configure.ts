import * as express from "express";
import * as expressLayouts from "express-ejs-layouts";
import socketIo from "socket.io";
import * as http from "http";

import flash from "connect-flash";
import * as session from "express-session";
import * as passport from "passport";
import * as mongoose from "mongoose";

import configurePassport from "../authentication/configurePassport";
import CST from "../SERVER_CST";

export default class ConfigManager {
  public static async configureMongoose() {
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  public static configureSocketIo(
    app: express.Express,
    port: number
  ): socketIo.Server {
    let server = http.createServer(app);
    let io = socketIo(server);

    server.listen(port, () => {
      console.log(`App listening on ${port}.`);
    });

    return io;
  }

  public static configureExpress(app: express.Express): express.Express {
    // Add the local strategy and serialization / deserialization to passport
    configurePassport(passport);

    // Set the ejs view engine
    app.set("view engine", "ejs");
    app.use(expressLayouts);

    // Express session middleware
    app.use(
      session({
        secret: process.env.SESSION_SECRET,
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
      res.locals[CST.TEMP_MSG.PASSPORT_ERR] = req.flash(
        CST.TEMP_MSG.PASSPORT_ERR
      );

      next();
    });

    return app;
  }
}
