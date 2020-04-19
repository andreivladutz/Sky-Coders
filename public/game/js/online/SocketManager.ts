import socketIoClient from "socket.io-client";
import Manager from "../managers/Manager";
import { Redirect } from "../../../common/MessageTypes";
import CST from "../CST";

import Socket = SocketIOClient.Socket;
import EventEmitter = Phaser.Events.EventEmitter;

export default class SocketManager extends Manager {
  private io: Socket;

  // the eventEmitter of this class! not the underlying socket.io
  public events: EventEmitter = new EventEmitter();

  public on: Socket["on"];
  public once: Socket["once"];
  public off: Socket["off"];
  public emit: Socket["emit"];
  public send: Socket["send"];

  private constructor() {
    super();

    this.io = socketIoClient();
    this.delegateMethods();

    // WARNING: THE CONNECT EVENT FIRES MULTIPLE TIME FOR THE CLIENT
    // ALONG THE LIFETIME OF THE GAME INSTANCE. DUE TO INTERNET CONNECTION
    // SOCKET CONNECTION TO THE SERVER CAN BE TEMPORARILY LOST. ON RECONNECT, ANOTHER SOCKET
    // ON THE SERVER-SIDE IS ALLOCATED AND THIS EVENT FIRES AGAIN
    this.once("connect", () => {
      this.events.emit(CST.IO.EVENTS.CONNECT);
    });

    // this.on("reconnect", () => {});

    this.listenToSystemEvents();
  }

  // Core events like Redirect
  private listenToSystemEvents() {
    // Redirect the client to the given path
    this.on(Redirect.EVENT, (newPath: Redirect.Path) => {
      globalThis.location.href = newPath;
    });
  }

  // Delegate io's methods to this
  private delegateMethods() {
    this.on = this.io.on.bind(this.io);
    this.once = this.io.once.bind(this.io);
    this.off = this.io.off.bind(this.io);
    this.emit = this.io.emit.bind(this.io);
    this.send = this.io.send.bind(this.io);
  }

  public static getInstance(): SocketManager {
    return super.getInstance() as SocketManager;
  }
}
