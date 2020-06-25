import Interpreter from "js-interpreter";
import Actor from "../gameObjects/Actor";
import CODE_CST, { InternalBuilding } from "./CODE_CST";

const API = CODE_CST.API_FUNCS;
const INTERNS = CODE_CST.INTERNALS;

/**
 * Each actor has its code interpreter
 */
export default class CodeInterpreter {
  private interpreter: Interpreter;
  private actor: Actor;
  // A flag to note that the interpreter is currently running internal code
  // That can be run in one go
  private isRunningInternalCode = false;

  // If the code is paused, waiting for an async op to finish
  // Use this flag to break out of the step function that does nothing
  private awaitingAsyncOp = false;

  public constructor(actor: Actor, code = "") {
    this.interpreter = new Interpreter(code, this.createBridgeApi);
    this.actor = actor;

    this.initInternals();
  }

  // Append code to be run by the interpreter
  public appendCode(newCode: string) {
    this.interpreter.appendCode(newCode);
  }

  // Returns false when the code has ended running
  public stepThroughCode(): boolean {
    for (let i = 0; i < CODE_CST.ALLOWED_STEPS && !this.awaitingAsyncOp; i++) {
      let keepRunning = this.interpreter.step();

      //console.log("Running code keepRunning = ", keepRunning);

      // If a portion of internals-related code is found, run it synchronously
      while (keepRunning && this.isRunningInternalCode) {
        keepRunning = this.interpreter.step();
      }

      if (!keepRunning) {
        return false;
      }
    }
    return true;
  }

  public addBuilding(buildingCfg: InternalBuilding) {
    this.wrapInternalCode(INTERNS.NEWBUILD_CALL(buildingCfg));
  }

  // Update the state of a building inside the interpreter
  // * if the production is ready
  public updateBuilding(buildingCfg: InternalBuilding) {
    this.wrapInternalCode(INTERNS.UPDATE_BUILD(buildingCfg));
    // this.appendCode(`
    // {
    //   var __buildsIds__ = Object.getOwnPropertyNames(__chara__.builds);
    //   for (var i = 0; i < __buildsIds__.length; i++) {
    //     var key = __buildsIds__[i];
    //     print(key);
    //   }
    // }
    // `);
  }

  // Wrap the internal code that can be run all at once in synchronous manner
  // Inside the two functions that change the flag of this interpreter
  private wrapInternalCode(code: string) {
    this.appendCode(`
      ${CODE_CST.START_INTERNAL_CODE}();
      ${code}
      ${CODE_CST.END_INTERNAL_CODE}();
    `);
  }

  private initInternals() {
    // Init the __chara__ object and all its methods
    this.wrapInternalCode(INTERNS.INIT_CODE());
  }

  // Set a synchronous wrapper function as a property with functionName
  private setSyncFunc(
    interpreter: Interpreter,
    nativeObject: Object,
    functionName: string,
    wrapperFunction: (...args: any[]) => any
  ): this {
    interpreter.setProperty(
      nativeObject,
      functionName,
      interpreter.createNativeFunction(wrapperFunction)
    );

    return this;
  }

  // Set an asynchronous wrapper function as a property with functionName
  private setAsyncFunc(
    interpreter: Interpreter,
    nativeObject: Object,
    functionName: string,
    wrapperFunction: (...args: any[]) => any
  ): this {
    interpreter.setProperty(
      nativeObject,
      functionName,
      interpreter.createAsyncFunction(wrapperFunction)
    );

    return this;
  }

  // Internal functions that are used by dev-code interpreter subprograms
  private createInternalWrappers(
    interpreter: Interpreter,
    globalObject: Object
  ) {
    let startOfInternalCode = () => {
      this.isRunningInternalCode = true;
      console.log("RUNNING INTERNAL CODE");
    };

    let endOfInternalCode = () => {
      this.isRunningInternalCode = false;
      console.log("STOPPED INTERNAL CODE");
    };

    this.setSyncFunc(
      interpreter,
      globalObject,
      CODE_CST.START_INTERNAL_CODE,
      startOfInternalCode
    ).setSyncFunc(
      interpreter,
      globalObject,
      CODE_CST.END_INTERNAL_CODE,
      endOfInternalCode
    );
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

    // Create a "self" reserved-named object to hold all the native functions for a character
    let selfObject = interpreter.nativeToPseudo({});
    interpreter.setProperty(globalObject, CODE_CST.SELF, selfObject);

    this.setSyncFunc(interpreter, selfObject, API.PRINT, alertWrapper)
      .setAsyncFunc(interpreter, selfObject, API.WALK_TO, walkToWrapper)
      .setAsyncFunc(
        interpreter,
        selfObject,
        API.REACHABLE,
        isCoordReachableWrapper
      )
      .setSyncFunc(interpreter, selfObject, API.POS_X, getXCoordWrapper)
      .setSyncFunc(interpreter, selfObject, API.POS_Y, getYCoordWrapper);

    this.createInternalWrappers(interpreter, globalObject);
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
      this.awaitingAsyncOp = true;
      await this.actor.navigationBlocklyHandler(xCoord, yCoord);
      setTimeout(() => {
        this.awaitingAsyncOp = false;
        finishedCb();
      }, CODE_CST.NAVIGATION.IDLE_TIME);
    };

    // Wrap the isReachable actor's method and return the result via the provided callback
    let isCoordReachableWrapper = async (
      xCoord: number,
      yCoord: number,
      finishedCb: (b: boolean) => void
    ) => {
      this.awaitingAsyncOp = true;
      let isReachable = await this.actor.isCoordReachable(xCoord, yCoord, true);
      this.awaitingAsyncOp = false;

      finishedCb(isReachable);
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
