import socketIoClient from "socket.io-client";
import Manager from "../managers/Manager";
import specialToken from "../../../common/specialToken";

import Socket = SocketIOClient.Socket;
import SocketIoEmitter = SocketIOClient.Emitter;

export default class MessageReceiver extends Manager {
  private io: Socket;

  public off: Socket["off"];
  public emit: Socket["emit"];
  public send: Socket["send"];

  protected constructor() {
    super();

    this.io = socketIoClient();
    this.delegateMethods();
  }

  public on(event: string, fn: (...args: any[]) => void): SocketIoEmitter {
    return this.io.on(event, this.customHandler(fn));
  }

  public once(event: string, fn: (...args: any[]) => void): SocketIoEmitter {
    return this.io.once(event, this.customHandler(fn));
  }

  /**
   * Abstract over a registered handler, such that the last parameter
   * i.e. the ack function can be called internally
   * @param providedHandler a on() / once() registered handler
   */
  private customHandler(providedHandler: (...args: any[]) => void) {
    return (...args: any[]) => {
      let ackFunction = args[args.length - 1];

      // if the last argument is not an ack function
      // then this message has been sent directly by a socket
      if (typeof ackFunction !== "function") {
        providedHandler(...args);

        return;
      }

      args.pop();

      let maybeToken = args[args.length - 1];

      // If this token is the last but one argument
      // then a custom ack function has to be passed to the handler
      if (maybeToken === specialToken) {
        args.pop();

        providedHandler(...args, ackFunction);
        return;
      }

      providedHandler(...args);
      ackFunction();
    };
  }

  // Delegate io's methods to this
  private delegateMethods() {
    this.off = this.io.off.bind(this.io);
    this.emit = this.io.emit.bind(this.io);
    this.send = this.io.send.bind(this.io);
  }
}
