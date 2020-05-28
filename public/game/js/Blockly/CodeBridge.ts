import Interpreter from "js-interpreter";

export default class CodeBridge {
  interpreter: Interpreter;

  public constructor(code = "") {
    this.interpreter = new Interpreter(code, this.createBridgeApi);
  }

  // Append code to be run by the interpreter
  public appendCode(newCode: string) {
    this.interpreter.appendCode(newCode);
  }

  // Returns false when the code has ended running
  public stepThroughCode(): boolean {
    return this.interpreter.step();
  }

  private createBridgeApi = (
    interpreter: Interpreter,
    globalObject: Object
  ) => {
    let alertWrapper = function(text = "") {
      alert(text);
    };

    interpreter.setProperty(
      globalObject,
      "alert",
      interpreter.createNativeFunction(alertWrapper)
    );
  };
}
