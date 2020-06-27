import ClientSocketIo from "socket.io-client";

import { Connection } from "../../../common/MessageTypes";
import BufferMessenger from "../../../common/MessageHandlers/BufferMessenger";
import Manager from "../managers/Manager";
import CST from "../CST";

import EventEmitter = Phaser.Events.EventEmitter;

export default class SocketManager extends Manager {
  /** Copy the behaviour by delegating the methods from @property messenger BufferMessenger instance */
  public on: BufferMessenger["on"];
  public once: BufferMessenger["once"];
  public emit: BufferMessenger["emit"];

  // Uids used to identify the client on the server-side
  private userUid: string;
  private socketUid: string;
  // Abstraction over the socket connection that buffers messages
  // Until they get confirmed as received
  private messenger: BufferMessenger;
  // the eventEmitter of this class! not the underlying socket.io
  public events: EventEmitter = new EventEmitter();

  // After a timeout period of being disconnected, log out completely
  private logoutTimeout: any;

  private constructor() {
    super();

    this.messenger = new BufferMessenger(ClientSocketIo());
    this.delegateMethods();

    // WARNING: THE CONNECT EVENT FIRES MULTIPLE TIME FOR THE CLIENT
    // ALONG THE LIFETIME OF THE GAME INSTANCE. DUE TO INTERNET CONNECTION
    // SOCKET CONNECTION TO THE SERVER CAN BE TEMPORARILY LOST. ON RECONNECT, ANOTHER SOCKET
    // ON THE SERVER-SIDE IS ALLOCATED AND THIS EVENT FIRES AGAIN
    this.messenger.socket.once("connect", () => {
      this.events.emit(CST.IO.EVENTS.CONNECT);

      // Let the server know this was the first connection
      this.messenger.socket.emit(Connection.CONNECT_EVENT);
    });

    // This socket reconnected to the server
    // As this event is listened to on a socket directly, don't use the messenger
    this.messenger.socket.on("reconnect", () => {
      let uids: Connection.Uids = {
        userUid: this.userUid,
        socketUid: this.socketUid
      };

      // On reconnecting in time, cancel the logout timeout
      clearTimeout(this.logoutTimeout);

      this.messenger.socket.emit(Connection.RECONNECT_EVENT, uids, () => {
        console.log("Reconnection acknowledged by the server");

        this.events.emit(CST.IO.EVENTS.RECONNECT);
        // Resend all lost messages
        this.messenger.resendMessages();
      });
    });

    this.listenToSystemEvents();
  }

  // Core events like Redirect
  private listenToSystemEvents() {
    // Redirect the client to the given path
    this.on(Connection.REDIRECT_EVENT, (newPath: Connection.Path) => {
      this.redirectClient(newPath);
    });

    // Init the uids of the socket and the user
    this.on(Connection.INIT_UIDS_EVENT, (uids: Connection.Uids) => {
      this.userUid = uids.userUid;
      this.socketUid = uids.socketUid;
    });

    this.messenger.socket.on("disconnect", () => {
      console.log("We have disconnected from the server");

      this.logoutTimeout = setTimeout(
        () => this.logout(),
        CST.COMMON_CST.CONNECTION.LOGOUT_TIMEOUT
      );
    });
  }

  private logout() {
    // this.redirectClient(CST.COMMON_CST.CONNECTION.LOGOUT_PATH);
    this.redirectClient("/");
  }

  // Redirect this client to another route
  public redirectClient(route: string) {
    globalThis.location.href = route;
  }

  // Delegate io's methods to this
  private delegateMethods() {
    this.emit = this.messenger.emit.bind(this.messenger);
    this.on = this.messenger.on.bind(this.messenger);
    this.once = this.messenger.once.bind(this.messenger);
  }

  public static getInstance(): SocketManager {
    return super.getInstance() as SocketManager;
  }
}
