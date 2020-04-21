import MessageReceiver from "./MessageReceiver";
import MessageSender from "./MessageSender";
import CommonSocket from "./CommonSocket";

class BufferMessenger {
  constructor(socket: CommonSocket) {
    this.socket = socket;
    this.messagesUnconfirmed = {};
  }
}

interface BufferMessenger extends MessageReceiver, MessageSender {
  /**
   * On old socket disconnect and reconnection, replace the underlying socket
   * Also all unconfirmed events (messages sent) are re-emited with the new socket
   * @param newSocket the new socket to replace the old one
   */
  replaceSocket(newSocket: CommonSocket): this;

  /**
   * Resend all buffered messages
   */
  resendMessages(): this;

  /**
   * Wrapper around the socket's emit, that bufferes messages until they get confirmed by the client
   * @param event event param to be sent to socket.emit
   * @param args extra args for socket.emit
   */
  emit(event: string, ...args: any[]): this;

  on(event: string, fn: (...args: any[]) => void): this;

  once(event: string, fn: (...args: any[]) => void): this;
}

// Function taken from typescript docs https://www.typescriptlang.org/docs/handbook/mixins.html
(function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name)
      );
    });
  });
})(BufferMessenger, [MessageReceiver, MessageSender]);

export default BufferMessenger;
