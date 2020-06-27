import { providedAckToken, customAckToken } from "./messengersTokens";

import SocketInterface from "./CommonSocket";
import SocketIoEmitter = SocketIOClient.Emitter;

export default abstract class MessageReceiver {
  public socket: SocketInterface;

  // public off: Socket["off"];
  // public emit: Socket["emit"];
  // public send: Socket["send"];

  public on(event: string, fn: (...args: any[]) => void): this {
    this.socket.on(event, this.customHandler(fn));

    return this;
  }

  public once(event: string, fn: (...args: any[]) => void): this {
    this.socket.once(event, this.customHandler(fn));

    return this;
  }

  // Identify if a token has been attached to the event data
  // I.e. a messageBuffer is used on the other side to send this message
  private isToken(maybeToken: any): boolean {
    return maybeToken === providedAckToken || maybeToken === customAckToken;
  }

  /**
   * Abstract over a registered handler, such that the last parameter
   * i.e. the ack function can be called internally
   * @param providedHandler a on() / once() registered handler
   */
  private customHandler(providedHandler: (...args: any[]) => void) {
    return (...args: any[]) => {
      let ackFunction = args[args.length - 1];
      let maybeToken = args[args.length - 2];

      // if the last argument is not an ack function or the message doesn't contain a special token
      // then this message has been sent directly by a socket
      if (typeof ackFunction !== "function" || !this.isToken(maybeToken)) {
        providedHandler(...args);

        return;
      }

      // pop the ack funcion and the token
      args.pop();
      args.pop();

      // If the token that is the last but one argument is a providedAckToken
      // then the custom ack function has to be passed to the handler
      if (maybeToken === providedAckToken) {
        providedHandler(...args, ackFunction);
        return;
      }

      providedHandler(...args);
      ackFunction();
    };
  }

  // Delegate io's methods to this
  // private delegateMethods() {
  //   this.off = this.io.off.bind(this.io);
  //   this.emit = this.io.emit.bind(this.io);
  //   this.send = this.io.send.bind(this.io);
  // }
}
