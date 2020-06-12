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

export type CodeCommand = {
  name: string;
  code: string;
};

// If the top level block is not a command then it is an event
function topLevelIsEvent(type: TopLevelBlocks) {
  return type !== TopLevelBlocks.COMMAND;
}

export default class ActorCodeHandler {
  // Keep a reference to the parent Actor
  private parentActor: Actor;
  // Keep an array of Blockly-defined commands
  // And their associated code to be run
  public codeCommands: CodeCommand[];
  // An array of registered events that have to be unregistered at some point
  private registeredEvents: {
    [EventType: string]: () => void;
  }[] = [];

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

  public processTopBlocks(
    JavaScript: Generator,
    workspace: Workspace,
    topBlocks: Block[]
  ) {
    // Overwrite all commands and registered events
    this.codeCommands = [];
    this.unregisterCodeEvents();

    for (let topBlock of topBlocks) {
      // Generate the variables for the workspace
      JavaScript.init(workspace);
      // Generate the code for each top block
      let blockCode = JavaScript.blockToCode(topBlock) as string;
      // Append the extra generated functions
      blockCode = JavaScript.finish(blockCode);

      this.processTopBlock(topBlock, blockCode);
    }
  }

  /**
   *
   * @param topBlock the block that's being processed
   * @param blockCode the block's string code to be run
   */
  private processTopBlock(topBlock: Block, blockCode: string) {
    let blockType = topBlock.type as TopLevelBlocks;

    // The top level blocks can be events
    if (topLevelIsEvent(blockType)) {
      this.registerCodeEvent(blockType, blockCode);
    }
    // Or command blocks
    else {
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
    this.terminal.commandsHandler.outputRunningCode(
      code.trimLeft().split("\n")
    );

    let interpreter = this.interpreter;
    interpreter.appendCode(code);

    let step = () => {
      let shouldContinue: boolean;

      try {
        shouldContinue = interpreter.stepThroughCode();
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
