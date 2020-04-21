import * as cookie from "cookie";
import GameInstance from "./GameInstance";
import cryptr from "../utils/cryptr";
import User, { UserType } from "../models/User";
import { Redirect, Connection } from "../../public/common/MessageTypes";
import CST from "../SERVER_CST";

import { NamespaceDebugger } from "../utils/debug";
import MessageSender from "../../public/common/MessageHandlers/MessageSender";
const debug = new NamespaceDebugger("GamesManager");

// Singleton manager of the game instances
export default class GamesManager {
  private static _instance = null;
  // Game instances, indexed by the user id and socket id
  // Keep them as a map so we can "release memory" on disconnect
  private connectedGames: {
    [UserId: string]: {
      [SocketId: string]: GameInstance;
    };
  } = {};

  /**
   * Wait for events from client to know if it is the first
   * connection or the client just reconnected
   * @param socket The new connected socket which can be a new
   * connection or just a reconnection
   */
  public initSocket(socket: SocketIO.Socket) {
    socket.on(Connection.CONNECT_EVENT, () => this.initGameInstance(socket));

    socket.on(
      Connection.RECONNECT_EVENT,
      async (uids: Connection.Uids, ack: () => void) => {
        let reconnectionSuccess = await this.reconnectClient(socket, uids);

        if (reconnectionSuccess) {
          ack();
        }
      }
    );
  }

  /**
   * Reconnect an already instantiated client game instance
   * @param socket The socket emitting the reconnect event
   * @param uids socket and user ids used to identify the gameInstance
   */
  public async reconnectClient(
    socket: SocketIO.Socket,
    uids: Connection.Uids
  ): Promise<boolean> {
    // Reconnection due to server restart
    if (
      !this.connectedGames[uids.userUid] ||
      !this.connectedGames[uids.userUid][uids.socketUid]
    ) {
      return await this.reconnectOnServerRestart(socket, uids);
    }

    // This user already has a game instance associated
    return this.replaceSocketOnReconnect(socket, uids);
  }

  public async initGameInstance(socket: SocketIO.Socket) {
    let user = await this.getUserFromCookie(socket);

    if (!user) {
      return;
    }

    debug.userHas(user, `connected to socket ${socket.id}`);

    this.addDisconnectListener(user, socket);

    if (!this.connectedGames[user.id]) {
      this.connectedGames[user.id] = {};
    }

    let newGameInstance = new GameInstance(socket, user);
    this.connectedGames[user.id][socket.id] = newGameInstance;

    // Check if the user is already connected from another device / page
    // When the new game completely loads, disconnect the other devices
    newGameInstance.once(CST.EVENTS.GAME.INITED, () => {
      if (newGameInstance.isLoggedOut) {
        return;
      }

      let otherGames = Object.values(this.connectedGames[user.id]);
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
  public logoutUser(
    socket: SocketIO.Socket | MessageSender,
    reason?: string
  ): this {
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
    if (!userId || !this.connectedGames[userId]) {
      return;
    }

    debug.debug(`User logout cleanup for userid: ${userId}`);

    // Discard the logged out users
    let loggedOutSocketsIds = Object.keys(this.connectedGames[userId]).filter(
      socketId => this.connectedGames[userId][socketId].isLoggedOut
    );

    for (let socketId of loggedOutSocketsIds) {
      delete this.connectedGames[userId][socketId];
    }

    // Only when the last user logged out
    if (Object.keys(this.connectedGames[userId]).length === 0) {
      delete this.connectedGames[userId];
    }

    return this;
  }

  // Called by the reconnectClient method
  private async reconnectOnServerRestart(
    socket: SocketIO.Socket,
    uids: Connection.Uids
  ): Promise<boolean> {
    // If we have to logout the user
    let logoutReason = "Your session expired. Please login again!";

    // If this user was never connected before on this newly restarted server
    this.connectedGames[uids.userUid] ||
      (this.connectedGames[uids.userUid] = {});

    // We have to get the user document from the db
    let user = await this.getUserFromCookie(socket);

    // If somehow the user id got altered (possibly manually by the user), logout the user
    if (!user || user.id !== uids.userUid) {
      this.logoutUser(socket, logoutReason);

      return false;
    }

    // Basically a new game instance with a new socket is created
    // Listen for this socket's disconnection as we would in the initGameInstance() method
    this.addDisconnectListener(user, socket);

    this.connectedGames[uids.userUid][uids.socketUid] = new GameInstance(
      socket,
      user,
      true
    );

    debug.userHas(
      user,
      `reconnected with socket ${socket.id} due to server restart`
    );

    return true;
  }

  // Called in the reconnectClient() method
  // Find the already instantiated gameInstance for a user and
  // replace that instance's socket with the newly connected one
  private replaceSocketOnReconnect(
    socket: SocketIO.Socket,
    uids: Connection.Uids
  ): boolean {
    let user: UserType;
    // If we have to logout the user
    let logoutReason = "Your session expired. Please login again!";

    // This user already has a game instance associated
    let gameInstance = this.connectedGames[uids.userUid][uids.socketUid];
    user = gameInstance.user;

    // If somehow the user id got altered (possibly manually by the user), logout the user
    if (user.id !== uids.userUid) {
      gameInstance.logout(logoutReason);

      return false;
    }

    gameInstance.replaceSocket(socket);

    this.addDisconnectListener(user, socket);
    debug.userHas(user, `reconnected with socket ${socket.id}`);

    return true;
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

  private addDisconnectListener(user: UserType, socket: SocketIO.Socket) {
    // Disconnects happen all the time, but socket.io will connect again and keep going
    socket.on("disconnect", () => {
      debug.userHas(user, `disconnected from socket ${socket.id}`);
    });
  }

  private constructor() {}

  public static getInstance(): GamesManager {
    if (!this._instance) {
      this._instance = new GamesManager();
    }

    return this._instance;
  }
}
