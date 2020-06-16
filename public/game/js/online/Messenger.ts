import SocketManager from "./SocketManager";

// Abstract base class for all Messengers
export default abstract class Messenger {
  protected socketManager: SocketManager;

  constructor(socketManager: SocketManager) {
    this.socketManager = socketManager;

    this.registerEventListening();
  }

  protected abstract registerEventListening(): void;
}
