import * as express from "express";
import * as dotenv from "dotenv";
import * as path from "path";

import authenticate from "./authentication/authenticateMiddleware";
// Routers
import usersRouter from "./routes/userRoute/userRouter";
import gameRouter from "./routes/gameRouter";
import CST from "./SERVER_CST";
import ConfigManager from "./utils/configure";
import GamesManager from "./game/GamesManager";

// Load the environment config from .env file
// As it seems to be some kind of race condition, the .env is also loaded in utils/debug -> NamespaceDebugger
dotenv.config({
  path: path.join(__dirname, "/../../config/.env"),
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
    .use(CST.WEB_MANIFEST, (req, res) => {
      res.sendFile(path.join(__dirname, CST.MANIFEST_FILE));
    })
    .use("/no_auth", express.static(CST.NO_AUTH_FOLDER))
    // the login / register path
    .use("/users", usersRouter)
    // authenticated game route
    //.use(authenticate, gameRouter);
    // TODO: Temporarily deactivated authentication
    .use(gameRouter)
    .use(express.static(CST.PUBLIC_FOLDER + "/build/"));
  // static files that do not require authentication
  //.use("/no_auth", express.static(CST.PUBLIC_FOLDER))
})();
