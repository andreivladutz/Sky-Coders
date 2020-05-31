import Interpreter from "js-interpreter";
import Actor from "../gameObjects/Actor";

/**
 * Each actor has its code interpreter
 */
export default class CodeInterpreter {
  private interpreter: Interpreter;
  private actor: Actor;

  public constructor(actor: Actor, code = "") {
    this.interpreter = new Interpreter(code, this.createBridgeApi);

    this.actor = actor;
  }

  // Append code to be run by the interpreter
  public appendCode(newCode: string) {
    this.interpreter.appendCode(newCode);
  }

  // Returns false when the code has ended running
  public stepThroughCode(): boolean {
    return this.interpreter.step();
  }

  // Bridge between the game code and the code run in the interpreter
  private createBridgeApi = (
    interpreter: Interpreter,
    globalObject: Object
  ) => {
    let alertWrapper = (text = "") => {
      this.actor.terminal.commandsHandler.codePrint(text);
    };

    interpreter.setProperty(
      globalObject,
      "alert",
      interpreter.createNativeFunction(alertWrapper)
    );

    // Walk to command block's handler function -> tile coordinates received
    // It is an asynchronous action, as walking somewhere takes time
    let walkToWrapper = async (
      xCoord: number,
      yCoord: number,
      finishedCb: () => void
    ) => {
      //this.actor.terminal.commandsHandler.codePrint(xCoord + " and " + yCoord);
      await this.actor.navigationBlocklyHandler(xCoord, yCoord);

      finishedCb();
    };

    interpreter.setProperty(
      globalObject,
      "walkTo",
      interpreter.createAsyncFunction(walkToWrapper)
    );
  };
}
