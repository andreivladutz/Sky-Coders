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

// Load the environment config from .env file
dotenv.config({
  path: path.join(__dirname, "/../../config/.env")
});

const PORT = Number(process.env.PORT) || 8080;

let app = ConfigManager.configureMongoose().configureExpress(express());
let io = ConfigManager.configureSocketIo(app, PORT);

// On a new connection, init a new game instance
io.on("connection", socket =>
  GamesManager.getInstance().initGameInstance(socket)
);

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
