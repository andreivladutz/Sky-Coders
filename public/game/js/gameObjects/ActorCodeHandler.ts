import Blockly, { Block, Generator, Workspace } from "blockly";

import CharacterTerminal from "../Blockly/CharacterTerminal";
import CodeInterpreter from "../Blockly/CodeInterpreter";
import Actor from "./Actor";
import CST from "../CST";

// The types of the top level blocks => commands and events
export enum TopLevelBlocks {
  EVENT_SELECTED = "events_selected",
  EVENT_PRODREADY = "events_prod_ready",
  COMMAND = "command"
}

const { TOPBLOCK_REGEX } = CST.BLOCKLY;

export type CodeCommand = {
  name: string;
  code: string;
};

export default class ActorCodeHandler {
  // Keep a reference to the parent Actor
  public parentActor: Actor;
  // Keep an array of Blockly-defined commands
  // And their associated code to be run
  public codeCommands: CodeCommand[];
  // An array of registered events that have to be unregistered at some point
  private registeredEvents: {
    [EventType: string]: () => void;
  }[] = [];
  // A functions map of pairs (functionName, functionCode)
  private functionsMap: Map<string, string>;

  // Each character has its terminal
  public terminal: CharacterTerminal;
  // Each character has its interpreter
  public interpreter: CodeInterpreter;
  // Each character has its blockly code
  public blocklyWorkspace: string = "";

  constructor(actor: Actor) {
    this.parentActor = actor;

    this.terminal = new CharacterTerminal(this.parentActor.actorKey);
    this.interpreter = new CodeInterpreter(this.parentActor);
  }

  // First process the functions, then the rest of the top blocks
  public processTopBlocks(
    JavaScript: Generator,
    workspace: Workspace,
    topBlocks: Block[]
  ) {
    // Overwrite all commands and registered events
    this.codeCommands = [];
    this.unregisterCodeEvents();

    // A functions map of pairs (functionName, functionCode)
    this.functionsMap = new Map();

    // Process the functions:
    for (let topBlock of topBlocks) {
      this.processTopBlock(topBlock, workspace, JavaScript);
    }
  }

  /**
   *
   * @param topBlock the block that's being processed
   * @param blockCode the block's string code to be run
   */
  private processTopBlock(
    topBlock: Block,
    workspace: Workspace,
    JavaScript: Generator
  ) {
    // Generate the variables for the workspace
    JavaScript.init(workspace);
    // Generate the code for each top block
    let blockCode = JavaScript.blockToCode(topBlock) as string;
    // Append the extra generated functions
    blockCode = JavaScript.finish(blockCode);

    let blockType = topBlock.type as TopLevelBlocks;

    // The top level blocks can be procedures!
    if (TOPBLOCK_REGEX.FUNCTION.test(blockType)) {
      // Get the callable name of the function. It will be used to identify the function call inside the code
      let functionName = JavaScript.variableDB_.getDistinctName(
        topBlock.getFieldValue("NAME"),
        Blockly.Procedures.NAME_TYPE
      );

      this.functionsMap.set(functionName, blockCode);
      // Define the functions inside the scope of the interpreter so they can be run
      this.interpreter.appendCode(blockCode);
    }
    // The top level blocks can be events
    else if (TOPBLOCK_REGEX.EVENT.test(blockType)) {
      this.registerCodeEvent(blockType, blockCode);
    }
    // Or command blocks
    else if (TOPBLOCK_REGEX.COMMAND.test(blockType)) {
      this.codeCommands.push({
        name: topBlock.getFieldValue("NAME"),
        code: blockCode
      });
    }
  }

  // Register an event that will run some code
  private registerCodeEvent(blockType: TopLevelBlocks, blockCode: string) {
    switch (blockType) {
      case TopLevelBlocks.EVENT_SELECTED:
        let selectHandler = () => {
          this.runBlocklyCode(blockCode);
        };

        this.parentActor.on(CST.EVENTS.OBJECT.SELECT, selectHandler);
        // Save the registered handler so we can unregister it later
        this.registeredEvents.push({
          [blockType]: selectHandler
        });
        break;
    }
  }

  private unregisterCodeEvents() {
    for (let event of this.registeredEvents) {
      for (let [blockType, registeredHandler] of Object.entries(event)) {
        switch (blockType) {
          case TopLevelBlocks.EVENT_SELECTED:
            this.parentActor.off(CST.EVENTS.OBJECT.SELECT, registeredHandler);
            break;
        }
      }
    }

    this.registeredEvents = [];
  }

  // Run the ith defined command (called by the CharacterUI)
  public runBlocklyCommand(index: number) {
    let chosenCmdCode = this.codeCommands[index].code;
    this.runBlocklyCode(chosenCmdCode);
  }

  // Run the code for a command / event block
  public runBlocklyCode(code: string) {
    code = code.trimLeft();
    let outputCode = code;

    // Check if the block code runs any of the defined functions and output the code
    for (let [functionName, functionCode] of this.functionsMap) {
      // If the block code calls any function we have to append the function's code
      if (~outputCode.search(functionName)) {
        outputCode = `${functionCode}\n${outputCode}`;
      }
    }

    this.terminal.commandsHandler.outputRunningCode(outputCode.split("\n"));
    this.interpreter.appendCode(code);

    let step = () => {
      let shouldContinue: boolean;

      try {
        shouldContinue = this.interpreter.stepThroughCode();
      } catch (e) {
        this.terminal.commandsHandler.reportCodeError(e);
      }

      if (shouldContinue) {
        setTimeout(step, 0);
      }
    };

    step();
  }
}
