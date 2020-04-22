import * as express from "express";
import * as dotenv from "dotenv";
import * as path from "path";

import authenticate from "./authentication/authenticateMiddleware";
// Routers
import authRouter from "./routes/authRouter";
import gameRouter from "./routes/gameRouter";
import CST from "./SERVER_CST";
import ConfigManager from "./utils/configure";
import GamesManager from "./game/GamesManager";
import BuildingsManager from "./game/BuildingsManager";

// Load the environment config from .env file
dotenv.config({
  path: path.join(__dirname, "/../../config/.env")
});

const PORT = Number(process.env.PORT) || 8080;

(async () => {
  // Wait for mongoose to connect to the db
  await ConfigManager.configureMongoose();

  let app = ConfigManager.configureExpress(express());
  let io = ConfigManager.configureSocketIo(app, PORT);

  // On a new connection, wait to see if it is
  // a new user connected (or same user on another device/ page),
  // or a user reconnecting (due to loss of internet connection or smth)
  io.on("connection", socket => {
    GamesManager.getInstance().initSocket(socket);
  });

  app
    .get(CST.WEB_MANIFEST, (req, res) => {
      res.sendFile(path.join(__dirname, CST.MANIFEST_FILE));
    })
    // the login / register path
    .use("/users", authRouter)
    // authenticated game route
    .use(authenticate, gameRouter);
  // static files that do not require authentication
  //.use("/no_auth", express.static(CST.PUBLIC_FOLDER))
})();
