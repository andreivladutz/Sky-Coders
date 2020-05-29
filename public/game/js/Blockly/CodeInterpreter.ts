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
  };
}
