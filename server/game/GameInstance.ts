import { Game, Connection } from "../../public/common/MessageTypes";
import randomstring from "randomstring";
import { EventEmitter } from "events";
import CST from "../SERVER_CST";
import GamesManager from "./GamesManager";
import { UserType } from "../models/User";
import Island, { IslandType } from "../models/Island";
import BufferMessenger from "../../public/common/MessageHandlers/BufferMessenger";
import BuildingsManager from "./BuildingsManager";

import * as mongoose from "mongoose";
import Document = mongoose.Document;
import DocumentArray = mongoose.Types.DocumentArray;

import { NamespaceDebugger } from "../utils/debug";
import CharactersManager from "./CharactersManager";
import { ResourcesType } from "../models/GameSchema";
import UsersManager from "./gameUtils/UsersQuery";
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

  private objectsManagers: {
    // The manager handling building related logic
    buildingsManger?: BuildingsManager;
    // The character's manager
    charactersManager?: CharactersManager;
    // The user querying component
    usersManager?: UsersManager;
  } = {};

  private updateInterval: any;
  // Prevent parallel save errors
  private savingDbDoc: boolean = false;
  // Another save is waiting to be sent to the db
  // As soon as the current save is persisted, launch another save
  private anotherSaveWaiting: boolean = false;

  // After a timeout time of being disconnected,
  // Declare the user logged out and clear the memory
  private logoutTimeout: any;

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

    // TODO: init these after joining the island doc
    this.objectsManagers.buildingsManger = new BuildingsManager(this);
    this.objectsManagers.charactersManager = new CharactersManager(this);
    this.objectsManagers.usersManager = new UsersManager(this);

    // If the user is just reconnecting, then the game is already
    // inited on the client side
    // TODO: this has to go!
    this._isGameInited = isUserReconnect;

    this.initClient();

    // Update this game instance on an interval
    this.updateInterval = setInterval(
      this.update.bind(this),
      CST.GAME_INSTANCE.UPDATE_INTERVAL
    );
  }

  /** Logout this current user instance
   * @param reason message can be provided for logging out
   * @param isKicked the user is being kicked for connecting on other devices / pages
   * @default false
   */
  public async logout(reason?: string, isKicked = false) {
    this.isLoggedOut = true;
    // Remove all listeners to avoid memory leaks
    this.removeListeners();

    GamesManager.getInstance()
      .logoutUser(this.sender, reason, isKicked)
      .onUserLoggedOut(this.userDocument.id);

    // Update once more before cleaning up i.e. save to the db
    await this.saveDocumentsToDb();
    // Stop the update interval
    clearInterval(this.updateInterval);
    this.objectsManagers.buildingsManger.cleanUp();
  }

  // Replace the socket used for comunicating to this particular user (on socket reconnect)
  public replaceSocket(newSocket: SocketIO.Socket) {
    // Remove old listeners before replacing the socket
    this.removeListeners();

    this.sender.replaceSocket(newSocket);

    // Add listeners on the new socket
    this.initListeners();

    // If the user reconnected in time, cancel the logout timeout
    clearTimeout(this.logoutTimeout);
    this.logoutTimeout = null;
  }

  // Remove listeners from socket to make sure there aren't memory leaks
  private removeListeners() {
    this.sender.socket.removeAllListeners();
  }

  // This is called on gameInstance init but it is also called on reconnect
  // When the sender's internal socket is replaced
  private initListeners() {
    // Event emitted when the game on the client completely loaded
    this.sender.once(Game.LOAD_EVENT, () => {
      if (this._isGameInited) {
        return;
      }

      this._isGameInited = true;
      this.emit(CST.EVENTS.GAME.INITED);
    });

    this.sender.socket.on("disconnect", () => {
      // Save everything to the db, in case the user
      // never connects again and has to be logged out
      if (this.userDocument) {
        this.saveDocumentsToDb();
      }

      if (this.logoutTimeout) {
        return;
      }

      // After disconnecting start a logout timeout
      this.logoutTimeout = setTimeout(() => {
        this.logoutTimeout = null;
        this.logout();
      }, CST.COMMON_CST.CONNECTION.LOGOUT_TIMEOUT);
    });

    for (let objectManager of Object.values(this.objectsManagers)) {
      objectManager.initListeners();
    }
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
    // TODO: This has to go!
    if (this._isGameInited) {
      this.initListeners();
      return;
    }

    // Internal errors loss of island object
    if (!this.currIslandDocument) {
      this.userDocument.game = null;

      return this.initClient();
    }

    this.seed = this.currIslandDocument.seed;

    // Init the game on the client side by sending the intial cfg
    let gameConfig: Game.Config = {
      seed: this.seed,
      languageCode: this.userDocument.languageCode,
      resources: this.userDocument.game.resources,
      buildings: this.currIslandDocument.buildings,
    };

    this.sender.emit(Game.INIT_EVENT, gameConfig);
    this.objectsManagers.charactersManager.sendCharacters();

    // Send the uids used to identify the client
    let uids: Connection.Uids = {
      socketUid: this.sender.socket.id,
      userUid: this.userDocument.id,
    };

    this.sender.emit(Connection.INIT_UIDS_EVENT, uids);
    this.initListeners();
  }

  // The first time a user connects, they don't have a game subdocument created
  private async createGameSubdoc() {
    this.userDocument.game = {
      resources: {
        coins: CST.GAME_CONFIG.INITIAL_COINS,
      } as ResourcesType,
      islands: [] as DocumentArray<IslandType>,
    };

    await this.createIsland();
  }

  // TODO: In the future, users should be able to create multiple islands
  private async createIsland() {
    let islandDoc = new Island({
      // generate a random 32 length string
      seed: randomstring.generate(),
      buildings: [],
      characters: [],
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
  private async update() {
    // If the socket is currently disconnected, don't update
    if (this.sender.socket.disconnected) {
      return;
    }

    await this.saveDocumentsToDb();
  }

  // Save the user document and island
  private async saveDocumentsToDb() {
    // Avoid Parallel save errors
    if (this.savingDbDoc) {
      this.anotherSaveWaiting = true;
      return;
    }
    this.savingDbDoc = true;

    // Save the island document
    await this.saveCurrentIslandDoc();
    // Save the user document
    await this.saveUserDoc();

    this.savingDbDoc = false;

    if (this.anotherSaveWaiting) {
      this.anotherSaveWaiting = false;
      await this.saveDocumentsToDb();
    }

    // debug.userHas(this.userDocument, "saved progress to db");
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
      if (err.name === "ParallelSaveError") {
        // TODO: Error that can be temporarily ignored
        return this.handleDbError(err, errMsg, false);
      }

      this.handleDbError(err, errMsg);
    }
  }

  private handleDbError(
    err: Error,
    errorDescription: string,
    shouldLogout: boolean = true
  ) {
    console.error(
      `Error for user ${this.userDocument.name}, id: ${this.userDocument.id}`
    );
    console.error(`Error description: ${errorDescription}`);
    console.error(err);

    if (shouldLogout) {
      this.logout("Internal server error. Please try again later!");
    }
  }
}
