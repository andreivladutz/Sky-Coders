import Blockly, { Block, Generator, Workspace } from "blockly";

import CharacterTerminal from "../Blockly/CharacterTerminal";
import CodeInterpreter from "../Blockly/CodeInterpreter";
import Actor from "./Actor";
import CST from "../CST";
import CODE_CST from "../Blockly/CODE_CST";
import BuildingsManager from "../managers/BuildingsManager";
import BuildingObject from "./BuildingObject";

let BLOCKS = CODE_CST.BLOCKS;

// The types of the top level blocks => commands and events
export enum TopLevelBlocks {
  EVENT_SELECTED = "events_selected",
  EVENT_PRODREADY = "events_prod_ready",
  COMMAND = "command",
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
    [EventType: string]: (...args: any[]) => void;
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
      this.handleFunction(JavaScript, topBlock, blockCode);
    }
    // The top level blocks can be events
    else if (TOPBLOCK_REGEX.EVENT.test(blockType)) {
      this.registerCodeEvent(topBlock, blockType, blockCode);
    }
    // Or command blocks
    else if (TOPBLOCK_REGEX.COMMAND.test(blockType)) {
      this.handleCommand(topBlock, blockCode);
    }
  }

  // Handle the "procedure_*" blocks
  private handleFunction(
    JavaScript: Generator,
    topBlock: Block,
    blockCode: string
  ) {
    // Get the callable name of the function. It will be used to identify the function call inside the code
    let functionName = JavaScript.variableDB_.getDistinctName(
      topBlock.getFieldValue("NAME"),
      Blockly.Procedures.NAME_TYPE
    );

    this.functionsMap.set(functionName, blockCode);
    // Define the functions inside the scope of the interpreter so they can be run
    this.interpreter.appendCode(blockCode);
  }

  // Handle the "command" block
  private handleCommand(topBlock: Block, blockCode: string) {
    this.codeCommands.push({
      name: topBlock.getFieldValue("NAME"),
      code: blockCode,
    });
  }

  // Handle the "production ready" event block
  private handleProdReadyEvent(
    block: Block,
    blockType: TopLevelBlocks,
    blockCode: string
  ) {
    // Get the building id from the dropdown
    let chosenBuildingId = block.getFieldValue(
      BLOCKS.PROD_READY.BUILDS_DROPDOWN
    );

    let prodReadyHandler = (building: BuildingObject) => {
      if (building.dbId === chosenBuildingId) {
        this.runBlocklyCode(blockCode);
      }
      // The user chose building "any" so any building that finishes its production fires the event
      else if (chosenBuildingId === BLOCKS.PROD_READY.ANY_OPTION_ID) {
        this.runBlocklyCode(
          blockCode.replace(BLOCKS.PROD_READY.ANY_OPTION_ID, building.dbId)
        );
      }
    };

    BuildingsManager.getInstance().EVENTS.on(
      CST.EVENTS.BUILDING.PROD_READY,
      prodReadyHandler
    );

    // Save the registered handler so we can unregister it later
    this.registeredEvents.push({
      [blockType]: prodReadyHandler,
    });

    // ALSO: should check if the production is already ready NOW

    // If the option is ANY -> take all the buildings that have prodready now
    if (chosenBuildingId === BLOCKS.PROD_READY.ANY_OPTION_ID) {
      let readyBuildings = BuildingsManager.getInstance().getProdReadyBuildings();

      for (let building of readyBuildings) {
        prodReadyHandler(building);
      }
    }
    // If the option is specific get that building
    else {
      let readyBuilding = BuildingsManager.getInstance().getBuildingWithId(
        chosenBuildingId
      );

      if (readyBuilding) {
        prodReadyHandler(readyBuilding);
      }
    }
  }

  private handleOnSelectedEvent(blockType: TopLevelBlocks, blockCode: string) {
    let selectHandler = () => {
      this.runBlocklyCode(blockCode);
    };

    this.parentActor.on(CST.EVENTS.OBJECT.SELECT, selectHandler);
    // Save the registered handler so we can unregister it later
    this.registeredEvents.push({
      [blockType]: selectHandler,
    });
  }

  // Register an event that will run some code
  private registerCodeEvent(
    topBlock: Block,
    blockType: TopLevelBlocks,
    blockCode: string
  ) {
    switch (blockType) {
      case TopLevelBlocks.EVENT_SELECTED:
        this.handleOnSelectedEvent(blockType, blockCode);
        break;
      case TopLevelBlocks.EVENT_PRODREADY:
        this.handleProdReadyEvent(topBlock, blockType, blockCode);
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
          case TopLevelBlocks.EVENT_PRODREADY:
            BuildingsManager.getInstance().EVENTS.off(
              CST.EVENTS.BUILDING.PROD_READY,
              registeredHandler
            );
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
