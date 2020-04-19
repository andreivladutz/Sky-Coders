import * as cookie from "cookie";
import GameInstance from "./GameInstance";
import cryptr from "../utils/cryptr";
import User, { UserType } from "../models/User";
import { Redirect } from "../../public/common/MessageTypes";
import CST from "../SERVER_CST";

import Debug from "debug";
const debug = Debug("GamesManager");

// Singleton manager of the game instances
export default class GamesManager {
  private static _instance = null;
  // Game instances, indexed by the user id
  // Keep them as a map so we can "release memory" on disconnect
  private connectedGames: {
    [UserId: string]: GameInstance[];
  } = {};

  public async initGameInstance(socket: SocketIO.Socket) {
    let user = await this.getUserFromCookie(socket);

    if (!user) {
      return;
    }

    debug(`User ${(user as UserType).name} connected to socket ${socket.id}`);

    // Disconnects happen all the time, but socket.io will connect again and keep going
    socket.on("disconnect", () => {
      debug(
        `User ${(user as UserType).name} disconnected from socket ${socket.id}`
      );
    });

    if (!this.connectedGames[user.id]) {
      this.connectedGames[user.id] = [];
    }

    for (let otherCons of this.connectedGames[user.id]) {
      if (socket === otherCons.socket) {
        console.log("IT S THE SAME SOCKET! " + socket.id);
      }
    }

    let newGameInstance = new GameInstance(socket, user);
    this.connectedGames[user.id].push(newGameInstance);

    // Check if the user is already connected from another device / page
    // When the new game completely loads, disconnect the other devices
    newGameInstance.once(CST.EVENTS.GAME.INITED, () => {
      if (newGameInstance.isLoggedOut) {
        return;
      }

      let otherGames = this.connectedGames[user.id];
      console.log("Other games length = " + otherGames.length);
      for (let otherDeviceGame of otherGames) {
        if (otherDeviceGame !== newGameInstance) {
          otherDeviceGame.logout("This account connected on another device");
        }
      }
    });
  }

  /**  Logout a specific user connected to @param socket
   *  A @param reason for logging out can be provided, in which case,
   *  a message will be shown to the user after logging out
   */
  public logoutUser(socket: SocketIO.Socket, reason?: string): this {
    console.log("LOGOUT HANDLER");
    let logoutRoute = "/users/logout";

    if (reason) {
      logoutRoute += `?${CST.ROUTES.LOGOUT_PARAM.REASON}=${reason}`;
    }

    socket.emit(Redirect.EVENT, logoutRoute);

    return this;
  }

  // Called from the authentication router /users/logout
  // Remove the game instance when the user logged out
  public onUserLoggedOut(userId: string): this {
    debug(`User logout cleanup for userid: ${userId}`);

    // Discard the logged out users
    this.connectedGames[userId] = this.connectedGames[userId].filter(
      game => !game.isLoggedOut
    );

    // Only when the last user logged out
    if (this.connectedGames[userId].length === 0) {
      delete this.connectedGames[userId];
    }

    return this;
  }

  private async getUserFromCookie(socket: SocketIO.Socket): Promise<UserType> {
    // The user's id should be stored in the session cookie
    let parsedCookies = cookie.parse(socket.handshake.headers.cookie);
    let encryptedId = parsedCookies[CST.SESSION_COOKIE.ID];

    // if the cookie got lost somehow, log the user out
    if (!encryptedId) {
      this.logoutUser(socket);

      return null;
    }

    // decrypt the user id
    let userId = cryptr.decrypt(encryptedId);
    // Retrieve the user
    let user = await User.findById(userId);

    if (!user) {
      this.logoutUser(socket);

      return null;
    }

    return user as UserType;
  }

  private constructor() {}

  public static getInstance(): GamesManager {
    if (!this._instance) {
      this._instance = new GamesManager();
    }

    return this._instance;
  }
}
