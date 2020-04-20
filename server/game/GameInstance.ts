import {
  GameInit,
  GameLoaded,
  BuildingPlacement
} from "../../public/common/MessageTypes";
import randomstring from "randomstring";
import { EventEmitter } from "events";

import CST from "../SERVER_CST";
import GamesManager from "./GamesManager";
import { UserType } from "../models/User";
import Island, { IslandType, BuildingType } from "../models/Island";

import MessageSender from "../utils/MessageSender";

// An instance of a game for a particular user
export default class GameInstance extends EventEmitter {
  // The user document from the db associated with this game instance
  private userDocument: UserType;

  public get user() {
    return this.userDocument;
  }

  // The message sender abstraction over the connection socket to this user
  public sender: MessageSender;
  // The random seed used by the user's game
  public seed: string;
  // Is the game on the client side completely initialised and loaded
  public isGameInited = false;
  // The gamesManager has to know when this instance has logged out
  public isLoggedOut = false;

  constructor(socket: SocketIO.Socket, userDocument: UserType) {
    super();

    this.sender = new MessageSender(socket);
    this.userDocument = userDocument;

    this.initListeners();
    this.initClient();
  }

  /** Logout this current user instance
   * A @param reason message can be provided for logging out
   */
  public logout(reason?: string) {
    this.isLoggedOut = true;

    GamesManager.getInstance()
      .logoutUser(this.sender, reason)
      .onUserLoggedOut(this.userDocument.id);
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
      if (this.isGameInited) {
        return;
      }

      this.isGameInited = true;

      this.emit(CST.EVENTS.GAME.INITED);
    });

    // Client player placed a building on the map
    this.sender.on(
      BuildingPlacement.REQUEST_EVENT,
      async (buildingInfo: BuildingType) => {
        console.log(
          `User ${this.userDocument.name}, id: ${this.userDocument.id} placed a ${buildingInfo.buildingType} building at (${buildingInfo.position.x}, ${buildingInfo.position.y})`
        );

        this.userDocument.game.islands[0].buildings.push(buildingInfo);

        try {
          await this.userDocument.game.islands[0].save();
        } catch (err) {
          this.handleDbError(
            err,
            "Failed to save island after pushing new building object to island"
          );
        }

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
  private async initClient() {
    if (!this.userDocument.game) {
      await this.createGameSubdoc();
    }

    try {
      // Join the islands on the document
      await this.userDocument.populate("game.islands").execPopulate();
    } catch (err) {
      this.handleDbError(
        err,
        "Failed populating islands path on user document in gameInstance"
      );

      return;
    }

    // TODO: In the future, if more islands get generated, replace the hardcoded 0
    this.seed = this.userDocument.game.islands[0].seed;

    let gameConfig: GameInit.Config = {
      seed: this.seed
    };

    this.sender.emit(GameInit.EVENT, gameConfig);
  }

  // The first time a user connects, they don't have a game subdocument created
  private async createGameSubdoc() {
    this.userDocument.game = {
      resources: {
        coins: CST.GAME_CONFIG.INITIAL_COINS
      },
      islands: []
    };

    try {
      await this.userDocument.save();
    } catch (err) {
      this.handleDbError(
        err,
        "Failed saving game subdocument on user document in gameInstance"
      );
    }

    await this.createIsland();
  }

  // TODO: In the future, users should be able to create multiple islands
  private async createIsland() {
    let islandDoc = new Island({
      // generate a random 32 length string
      seed: randomstring.generate(),
      buildings: []
    });

    // Save the island document
    try {
      await islandDoc.save();
    } catch (err) {
      this.handleDbError(
        err,
        "Failed saving generated island on user document in gameInstance"
      );
    }

    this.userDocument.game.islands.push(islandDoc.id);
    // After pushing the island's id on it, save the user document
    try {
      await this.userDocument.save();
    } catch (err) {
      this.handleDbError(err, "Failed to save user document in gameInstance");
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
