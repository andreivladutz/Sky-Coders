import { GameInit } from "../../public/common/MessageTypes";
import randomstring from "randomstring";

// An instance of a game for a particular user
export default class GameInstance {
  // The connection to this user
  socket: SocketIO.Socket;

  // The random seed used by the user's game
  public seed: string;

  constructor(socket: SocketIO.Socket) {
    this.socket = socket;

    this.initClient();
  }

  // Fire the initialisation event
  private initClient() {
    // generate a random 32 length string
    this.seed = randomstring.generate();

    let gameConfig: GameInit.Config = {
      seed: this.seed
    };

    // When the game init event is received, response immediately
    this.socket.emit(GameInit.EVENT, gameConfig);
  }
}
