import { providedAckToken, customAckToken } from "./messengersTokens";
import SocketInterface from "./CommonSocket";

interface Message {
  eventName: string;
  payload: any[];
}

type AcknowledgeFunction = (...args: any[]) => void;

// Abstraction over the socket class in socket.io
// Which buffers unsent messages and guarantees message
// delivery as long as the client will reconnect (and the old socket is replaced with a new one)
export default abstract class MessageSender {
  // Socket associated with a user, will be replaced as user looses connection and reconnects
  public socket: SocketInterface;
  // All unconfirmed messages are buffered by an uid until they get acknowledged
  protected messagesUnconfirmed: { [eventUid: string]: Message };

  /**
   * On old socket disconnect and reconnection, replace the underlying socket
   * Also all unconfirmed events (messages sent) are re-emited with the new socket
   * @param newSocket the new socket to replace the old one
   */
  public replaceSocket(newSocket: SocketInterface): this {
    this.socket = newSocket;

    return this.resendMessages();
  }

  /**
   * Resend all buffered messages
   */
  public resendMessages(): this {
    for (let eventUid of Object.keys(this.messagesUnconfirmed)) {
      let message = this.messagesUnconfirmed[eventUid];

      this.internalEmit(message.eventName, eventUid, message.payload);
    }

    return this;
  }

  /**
   * Wrapper around the socket's emit, that bufferes messages until they get confirmed by the client
   * @param event event param to be sent to socket.emit
   * @param args extra args for socket.emit
   */
  public emit(event: string, ...args: any[]): this {
    let eventUid = this.indexMessage(event, args);

    this.internalEmit(event, eventUid, args);
    return this;
  }

  /**
   * Index a message in the unconfirmed messages by finding a unique identifier
   * for this event name which doesn t collide with the other event names already indexed
   * @param event event name from emit()
   * @param payload args to be sent along to the emit method
   */
  private indexMessage(event: string, payload: any[]): string {
    let idx = 0,
      eventUid = event + idx;

    // An event with this uid already exists
    while (this.messagesUnconfirmed[eventUid]) {
      idx++;
      eventUid = event + idx;
    }

    this.messagesUnconfirmed[eventUid] = {
      eventName: event,
      payload
    };

    return eventUid;
  }

  /**
   * Wrapper around socket emit which waits for acknowledgment
   * @param event emit() param
   * @param eventUid event identifier in the unconfirmed messages map
   * @param args emit() params
   */
  private internalEmit(event: string, eventUid: string, args: any[]) {
    let providedAck: AcknowledgeFunction = null;
    // An ack function has been provided to the emit wrapper
    if (typeof args[args.length - 1] === "function") {
      providedAck = args[args.length - 1];

      // Copy the args array so it doesn't get destroyed (without the last element)
      args = args.filter((val, idx) => idx < args.length - 1);
    }

    let customAck = this.customAck(eventUid, providedAck),
      specialToken: string;

    if (providedAck) {
      specialToken = providedAckToken;
    } else {
      specialToken = customAckToken;
    }

    // If an ack is provided to emit() then send a special token, so the client knows that
    // Otherwise, the normal token is used
    this.socket.emit(event, ...args, specialToken, customAck);
  }

  /**
   * Returns a custom ack function such that this class knows when the client has received an event
   * @param eventUid event identifier in the unconfirmed messages map
   * @param providedAck a ack function provided by the user to the emit() wrapper on this
   */
  private customAck(eventUid: string, providedAck: AcknowledgeFunction) {
    return (...args: any[]) => {
      if (providedAck) {
        providedAck(...args);
      }

      // Once the message has been acknowledged, remove the message from the map
      delete this.messagesUnconfirmed[eventUid];
    };
  }

  // public on(event: string, listener: (...args: any[]) => void): this {
  //   this.socket.on(event, listener);

  //   return this;
  // }

  // public once(event: string, listener: (...args: any[]) => void): this {
  //   this.socket.once(event, listener);

  //   return this;
  // }

  // public off(event: string, listener: (...args: any[]) => void): this {
  //   this.socket.off(event, listener);

  //   return this;
  // }

  // public removeAllListeners(event?: string): this {
  //   this.socket.removeAllListeners(event);

  //   return this;
  // }
}
