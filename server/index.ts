import * as express from "express";
import cryptr from "./utils/cryptr";
import * as dotenv from "dotenv";
import * as path from "path";
import * as cookie from "cookie";

import authenticate from "./authentication/authenticateMiddleware";
// Routers
import authRouter from "./routes/authRouter";
import gameRouter from "./routes/gameRouter";
import CST from "./SERVER_CST";
import ConfigManager from "./utils/configure";
import GameInstance from "./game/GameInstance";
import User from "./models/User";

import { Redirect } from "../public/common/MessageTypes";

// Load the environment config from .env file
dotenv.config({
  path: path.join(__dirname, "/../../config/.env")
});

const PORT = Number(process.env.PORT) || 8080;

let app = ConfigManager.configureMongoose().configureExpress(express());
let io = ConfigManager.configureSocketIo(app, PORT);

io.on("connection", async socket => {
  // The user's id should be stored in the session cookie
  let parsedCookies = cookie.parse(socket.handshake.headers.cookie);
  let encryptedId = parsedCookies[CST.SESSION_COOKIE.ID];

  // if the cookie got lost somehow, log the user out
  if (!encryptedId) {
    socket.emit(Redirect.EVENT, "/users/logout");

    return;
  }

  // decrypt the user id
  let userId = cryptr.decrypt(encryptedId);
  // Retrieve the user
  let user = await User.findById(userId);

  if (!user) {
    socket.emit(Redirect.EVENT, "/users/logout");

    return;
  }

  console.log(user);

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
