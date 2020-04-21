import {
  GameInit,
  GameLoaded,
  BuildingPlacement,
  Connection
} from "../../public/common/MessageTypes";
import randomstring from "randomstring";
import { EventEmitter } from "events";
import CST from "../SERVER_CST";
import GamesManager from "./GamesManager";
import { UserType } from "../models/User";
import Island, { IslandType, BuildingType } from "../models/Island";
import BufferMessenger from "../../public/common/MessageHandlers/BufferMessenger";

import * as mongoose from "mongoose";
import Document = mongoose.Document;

import { NamespaceDebugger } from "../utils/debug";
const debug = new NamespaceDebugger("GameInstance");

// An instance of a game for a particular user
export default class GameInstance extends EventEmitter {
  // The user document from the db associated with this game instance
  private userDocument: UserType;
  public get user() {
    return this.userDocument;
  }

  public get currIslandDocument() {
    return this.userDocument?.game?.islands[this.currentIsland];
  }

  // The messages with buffering abstraction over the connection socket to this user
  public sender: BufferMessenger;

  private updateInterval: any;

  // The gamesManager has to know when this instance has logged out
  public isLoggedOut = false;
  // Is the game on the client side completely initialised and loaded
  private _isGameInited = false;
  public get isGameInited() {
    return this._isGameInited;
  }
  // The random seed used by the user's game
  public seed: string;
  // TODO: In the future, if more islands get generated, replace the hardcoded 0
  private currentIsland = 0;

  constructor(
    socket: SocketIO.Socket,
    userDocument: UserType,
    isUserReconnect = false
  ) {
    super();

    this.sender = new BufferMessenger(socket);
    this.userDocument = userDocument;

    // If the user is just reconnecting, then the game is already
    // inited on the client side
    this._isGameInited = isUserReconnect;

    this.initListeners();
    this.initClient();

    // Update this game instance on an interval
    this.updateInterval = setInterval(
      this.update.bind(this),
      CST.GAME_INSTANCE.UPDATE_INTERVAL
    );
  }

  /** Logout this current user instance
   * A @param reason message can be provided for logging out
   */
  public logout(reason?: string) {
    this.isLoggedOut = true;

    GamesManager.getInstance()
      .logoutUser(this.sender, reason)
      .onUserLoggedOut(this.userDocument.id);

    // Stop the update interval
    clearInterval(this.updateInterval);
  }

  // Replace the socket used for comunicating to this particular user (on socket reconnect)
  public replaceSocket(newSocket: SocketIO.Socket) {
    this.sender.replaceSocket(newSocket);

    // Add listeners on the new socket
    this.initListeners();
  }

  private initListeners() {
    // Event emitted when the game on the client completely loaded
    this.sender.once(GameLoaded.EVENT, () => {
      if (this._isGameInited) {
        return;
      }

      this._isGameInited = true;
      this.emit(CST.EVENTS.GAME.INITED);
    });

    this.sender.socket.on("disconnect", () => {
      this.saveDocumentsToDb();
    });

    // Client player placed a building on the map
    this.sender.on(
      BuildingPlacement.REQUEST_EVENT,
      async (buildingInfo: BuildingType) => {
        debug.userHas(
          this.userDocument,
          `placed a ${buildingInfo.buildingType} building at (${buildingInfo.position.x}, ${buildingInfo.position.y})`
        );

        this.currIslandDocument.buildings.push(buildingInfo);

        let resourcesAfterPlacement: BuildingPlacement.ResourcesAfterPlacement = {
          coins: this.userDocument.game.resources.coins,
          // Pass the building position so it can be identified on the client-side
          buildingPosition: buildingInfo.position
        };

        this.sender.emit(
          BuildingPlacement.APPROVE_EVENT,
          resourcesAfterPlacement
        );
      }
    );
  }

  // Fire the initialisation event
  // ON SERVER RESTART, this is still called
  // even for clients that were ALREADY connected
  private async initClient() {
    if (!this.userDocument.game || !this.userDocument.game.islands.length) {
      await this.createGameSubdoc();
    }

    if (!(await this.populateIslandsPath())) {
      return;
    }

    // This method is being called on client reconnection
    // after a sv restart. No need to reinit the client
    if (this._isGameInited) {
      return;
    }

    this.seed = this.currIslandDocument.seed;

    // Init the game on the client side by sending the intial cfg
    let gameConfig: GameInit.Config = {
      seed: this.seed
    };

    this.sender.emit(GameInit.EVENT, gameConfig);

    // Send the uids used to identify the client
    let uids: Connection.Uids = {
      socketUid: this.sender.socket.id,
      userUid: this.userDocument.id
    };

    this.sender.emit(Connection.INIT_UIDS_EVENT, uids);
  }

  // The first time a user connects, they don't have a game subdocument created
  private async createGameSubdoc() {
    this.userDocument.game = {
      resources: {
        coins: CST.GAME_CONFIG.INITIAL_COINS
      },
      islands: []
    };

    await this.createIsland();
  }

  // TODO: In the future, users should be able to create multiple islands
  private async createIsland() {
    let islandDoc = new Island({
      // generate a random 32 length string
      seed: randomstring.generate(),
      buildings: []
    });

    // Save the new island document so it can be found on the next join
    await this.saveDbDoc(
      islandDoc,
      "Failed saving generated island in gameInstance"
    );

    this.userDocument.game.islands.push(islandDoc.id);
  }

  // Update the game instance
  // * save the user doc and the island
  private update() {
    // If the socket is currently disconnected, don't update
    if (this.sender.socket.disconnected) {
      return;
    }

    this.saveDocumentsToDb();
  }

  // Save the user document and island
  private async saveDocumentsToDb() {
    // Save the island document
    await this.saveCurrentIslandDoc();
    // Save the user document
    await this.saveUserDoc();

    debug.userHas(this.userDocument, "saved progress to db");
  }

  // Retrieve all islands from the db for this user using mongoose(it executes a join)
  private async populateIslandsPath() {
    try {
      // Join the islands on the document
      await this.userDocument.populate("game.islands").execPopulate();
    } catch (err) {
      this.handleDbError(
        err,
        "Failed populating islands path on user document in gameInstance"
      );

      return false;
    }

    return true;
  }

  // Save the current islandDocument to the db
  private async saveCurrentIslandDoc() {
    await this.saveDbDoc(
      this.currIslandDocument,
      "Failed saving island document in gameInstance"
    );
  }

  // Save the userDocument to the db
  private async saveUserDoc() {
    await this.saveDbDoc(
      this.userDocument,
      "Failed to save user document in gameInstance"
    );
  }

  // General save doc with error handling
  private async saveDbDoc(doc: Document, errMsg: string) {
    try {
      await doc.save();
    } catch (err) {
      this.handleDbError(err, errMsg);
    }
  }

  private handleDbError(err, errorDescription: string) {
    console.error(
      `Error for user ${this.userDocument.name}, id: ${this.userDocument.id}`
    );
    console.error(`Error description: ${errorDescription}`);
    console.error(err);

    this.logout("Internal server error. Please try again later!");
  }
}
