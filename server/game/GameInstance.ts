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

    this.listenForInit();
  }

  // Start listening for the initialisation event
  private listenForInit() {
    // generate a random 32 length string
    this.seed = randomstring.generate();

    // When the game init event is received, response immediately
    this.socket.on(GameInit.EVENT, (response: GameInit.ackFunc) => {
      response({
        seed: this.seed
      });
    });
  }
}
