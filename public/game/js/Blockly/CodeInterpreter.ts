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

  // Set a synchronous wrapper function as a global property with functionName
  private setSyncFunc(
    interpreter: Interpreter,
    globalObject: Object,
    functionName: string,
    wrapperFunction: (...args: any[]) => any
  ): this {
    interpreter.setProperty(
      globalObject,
      functionName,
      interpreter.createNativeFunction(wrapperFunction)
    );

    return this;
  }

  // Set an asynchronous wrapper function as a global property with functionName
  private setAsyncFunc(
    interpreter: Interpreter,
    globalObject: Object,
    functionName: string,
    wrapperFunction: (...args: any[]) => any
  ): this {
    interpreter.setProperty(
      globalObject,
      functionName,
      interpreter.createAsyncFunction(wrapperFunction)
    );

    return this;
  }

  // Bridge between the game code and the code run in the interpreter
  private createBridgeApi = (
    interpreter: Interpreter,
    globalObject: Object
  ) => {
    let [
      alertWrapper,
      walkToWrapper,
      isCoordReachableWrapper,
      getXCoordWrapper,
      getYCoordWrapper
    ] = this.getApiWrappers();

    this.setSyncFunc(interpreter, globalObject, "alert", alertWrapper)
      .setAsyncFunc(interpreter, globalObject, "walkTo", walkToWrapper)
      .setAsyncFunc(
        interpreter,
        globalObject,
        "isCoordReachable",
        isCoordReachableWrapper
      )
      .setSyncFunc(interpreter, globalObject, "getXCoord", getXCoordWrapper)
      .setSyncFunc(interpreter, globalObject, "getYCoord", getYCoordWrapper);
  };

  private getApiWrappers(): ((...args: any[]) => any)[] {
    let alertWrapper = (text = "") => {
      this.actor.codeHandler.terminal.commandsHandler.codePrint(text);
    };

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

    // Wrap the isReachable actor's method and return the result via the provided callback
    let isCoordReachableWrapper = async (
      xCoord: number,
      yCoord: number,
      finishedCb: (b: boolean) => void
    ) => {
      finishedCb(await this.actor.isCoordReachable(xCoord, yCoord, true));
    };

    let getXCoordWrapper = () => {
      return this.actor.tileX;
    };

    let getYCoordWrapper = () => {
      return this.actor.tileY;
    };

    return [
      alertWrapper,
      walkToWrapper,
      isCoordReachableWrapper,
      getXCoordWrapper,
      getYCoordWrapper
    ];
  }
}
