import { Redirect, Connection } from "../../../common/MessageTypes";
import MessageReceiver from "./MessageReceiver";
import CST from "../CST";

import EventEmitter = Phaser.Events.EventEmitter;

export default class SocketManager extends MessageReceiver {
  // Uids used to identify the client on the server-side
  private userUid: string;
  private socketUid: string;

  // the eventEmitter of this class! not the underlying socket.io
  public events: EventEmitter = new EventEmitter();

  private constructor() {
    super();

    // WARNING: THE CONNECT EVENT FIRES MULTIPLE TIME FOR THE CLIENT
    // ALONG THE LIFETIME OF THE GAME INSTANCE. DUE TO INTERNET CONNECTION
    // SOCKET CONNECTION TO THE SERVER CAN BE TEMPORARILY LOST. ON RECONNECT, ANOTHER SOCKET
    // ON THE SERVER-SIDE IS ALLOCATED AND THIS EVENT FIRES AGAIN
    this.once("connect", () => {
      this.events.emit(CST.IO.EVENTS.CONNECT);

      // Let the server know this was the first connection
      this.emit(Connection.CONNECT_EVENT);
    });

    // This socket reconnected to the server
    this.on("reconnect", () => {
      let uids: Connection.Uids = {
        userUid: this.userUid,
        socketUid: this.socketUid
      };

      this.emit(Connection.RECONNECT_EVENT, uids);
    });

    this.listenToSystemEvents();
  }

  // Core events like Redirect
  private listenToSystemEvents() {
    // Redirect the client to the given path
    this.on(Redirect.EVENT, (newPath: Redirect.Path) => {
      globalThis.location.href = newPath;
    });

    // Init the uids of the socket and the user
    this.on(Connection.INIT_UIDS_EVENT, (uids: Connection.Uids) => {
      this.userUid = uids.userUid;
      this.socketUid = uids.socketUid;
    });
  }

  public static getInstance(): SocketManager {
    return super.getInstance() as SocketManager;
  }
}
