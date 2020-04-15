import * as express from "express";
import socketIo from "socket.io";
import * as dotenv from "dotenv";
import * as path from "path";

import authenticate from "./authentication/authenticateMiddleware";
// Routers
import authRouter from "./routes/authRouter";
import gameRouter from "./routes/gameRouter";
import CST from "./SERVER_CST";
import ConfigManager from "./utils/configure";
import GameInstance from "./game/GameInstance";

// Load the environment config from .env file
dotenv.config({
  path: path.join(__dirname, "/../../config/.env"),
  debug: true
});

const PORT = Number(process.env.PORT) || 8080;

let app = ConfigManager.configureMongoose().configureExpress(express());
let io = ConfigManager.configureSocketIo(app, PORT);

io.on("connection", (socket) => {
  console.log(socket.id);

  new GameInstance(socket);
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
