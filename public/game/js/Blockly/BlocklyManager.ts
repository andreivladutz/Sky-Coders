import Manager from "../managers/Manager";
import Blockly from "blockly";
import CST from "../CST";
import GameWindow from "../ui/GameWindow";
import Actor from "../gameObjects/Actor";

import defineCustomBlocks from "./Workspace/blockDefs/customBlocks";

const { JavaScript } = Blockly as any;

export default class BlocklyManager extends Manager {
  private readonly darkTheme: Blockly.Theme = (Blockly as any).Themes.Dark;
  private readonly classicTheme: Blockly.Theme = (Blockly as any).Themes
    .Classic;

  public workspace: Blockly.WorkspaceSvg;

  private currentActor: Actor;

  private darkModeToggleButton: HTMLButtonElement;
  private window: GameWindow;

  protected constructor() {
    super();

    this.darkTheme.setStartHats(true);
    this.classicTheme.setStartHats(true);
  }

  // "download" the current state of the workspace in text
  public getWorkspaceTextState() {
    let domRepresentation = Blockly.Xml.workspaceToDom(this.workspace);

    return Blockly.Xml.domToText(domRepresentation);
  }

  // restore the state of the workspace from text
  public setWorkspaceStateFromText(textState: string) {
    let domRepresentation = Blockly.Xml.textToDom(textState);

    Blockly.Xml.clearWorkspaceAndLoadFromXml(domRepresentation, this.workspace);
  }

  public getCode(): string {
    return JavaScript.workspaceToCode(this.workspace);
  }

  public closeWorkspace() {
    // Hide the button instantly
    this.darkModeToggleButton.style.display = "none";

    this.window.once(CST.WINDOW.CLOSE_ANIM_EVENT, () => {
      this.hideWorkspace();
    });

    // Save current's workspace state for this actor
    this.window.closeWindow();
    this.currentActor.blocklyCode = this.getWorkspaceTextState();

    let code = this.getCode();
    this.currentActor.terminal.commandsHandler.outputRunningCode(
      code.split("\n")
    );

    let interpreter = this.currentActor.interpreter;
    interpreter.appendCode(code);

    let step = () => {
      let shouldContinue: boolean;

      try {
        shouldContinue = interpreter.stepThroughCode();
      } catch (e) {
        this.currentActor.terminal.commandsHandler.reportCodeError(e);
      }

      if (shouldContinue) {
        setTimeout(step, 0);
      }
    };

    step();
  }

  // Show all workspace-related element with an animated transition
  // Opening the workspace for a specific actor
  public showWorkspace(actor: Actor) {
    this.currentActor = actor;

    try {
      this.setWorkspaceStateFromText(actor.blocklyCode);
    } catch {
      this.workspace.clear();
    }

    this.window.once(CST.WINDOW.OPEN_ANIM_EVENT, () => {
      this.darkModeToggleButton.style.display = "";
    });

    this.window.openWindow();

    this.workspace.setVisible(true);
    Blockly.svgResize(this.workspace);
  }

  // Close and hide all workspace-related element
  private hideWorkspace() {
    this.workspace.setVisible(false);

    this.darkModeToggleButton.style.display = "none";
  }

  // Init should be called before using the workspace! (It is called in the MainUI constructor)
  // The toolbox xml is being loaded by Phaser's loader and taken from Phaser's cache
  public init(cache: Phaser.Cache.CacheManager) {
    let toolboxXml = cache.xml.get(this.toolboxKey);

    if (!toolboxXml) {
      throw new Error(
        "The toolbox XML could not be retreived from the cache in BlocklyManager's constructor"
      );
    }

    this.initBlocks(cache);
    this.initWorkspace(toolboxXml);
    this.initDarkToggleButton();

    this.window = new GameWindow(
      document.getElementById(CST.BLOCKLY.CONTAINER_ID) as HTMLDivElement
    );

    this.window.on(CST.WINDOW.CLOSE_EVENT, this.closeWorkspace.bind(this));
    this.hideWorkspace();
  }

  private initDarkToggleButton() {
    this.darkModeToggleButton = document.querySelector(
      ".nightModeButton"
    ) as HTMLButtonElement;

    this.darkModeToggleButton.onclick = () => {
      let wasDarkMode = this.darkModeToggleButton.classList.toggle(
        "night-mode"
      );

      if (wasDarkMode) {
        this.workspace.setTheme(this.classicTheme);
      } else {
        this.workspace.setTheme(this.darkTheme);
      }
    };
  }

  private initWorkspace(toolboxXml: HTMLDocument) {
    this.workspace = Blockly.inject(CST.BLOCKLY.AREA_ID, {
      toolbox: toolboxXml.getElementById(CST.BLOCKLY.TOOLBOX_ID),
      // horizontalLayout: true,
      theme: this.darkTheme,
      zoom: {
        controls: true
      },
      move: {
        scrollbars: true,
        drag: true
      },
      trashcan: true,
      renderer: "zelos"
    });
  }

  // Init the custom Blockly blocks from the loaded json defs (already parsed)
  private initBlocks(cache: Phaser.Cache.CacheManager) {
    let blockDefs: Object[] = [];

    for (let blockDefKey of this.blockDefsJsonKeys) {
      blockDefs = blockDefs.concat(cache.json.get(blockDefKey));
    }

    defineCustomBlocks(blockDefs);
  }

  // Load the toolbox xml
  public async preload(load: Phaser.Loader.LoaderPlugin) {
    this.loadResources(load);
  }

  // Load the toolbox and blocks json definitions
  loadResources(load: Phaser.Loader.LoaderPlugin) {
    const { RESOURCES } = CST.BLOCKLY;
    const { BLOCKS } = RESOURCES;

    // The path to the toolbox
    load.setPath(RESOURCES.PATH);
    load.setPrefix(RESOURCES.BLOCKLY_PREFIX);

    load.xml(RESOURCES.TOOLBOX_KEY, RESOURCES.TOOLBOX_XML);

    // The path to the json blocks defs
    load.setPath(RESOURCES.PATH + BLOCKS.JSON_PATH);

    // Load all categories defs
    // e.g. "environment" + "_blocks" etc.
    for (let categoryName of BLOCKS.CATEGORIES) {
      load.json(categoryName, categoryName.concat(BLOCKS.FILENAME_SUFFIX));
    }

    // clear the path and prefix afterwards
    load.setPath();
    load.setPrefix();
  }

  private get toolboxKey() {
    const { RESOURCES: RESOURCES } = CST.BLOCKLY;

    return `${RESOURCES.BLOCKLY_PREFIX}${RESOURCES.TOOLBOX_KEY}`;
  }

  // Get the keys of all the json block definition files
  private get blockDefsJsonKeys() {
    const { RESOURCES } = CST.BLOCKLY;
    const { BLOCKS } = RESOURCES;

    return BLOCKS.CATEGORIES.map(filename =>
      RESOURCES.BLOCKLY_PREFIX.concat(filename)
    );
  }

  public static getInstance(): BlocklyManager {
    return super.getInstance() as BlocklyManager;
  }
}

Manager.subscribeToLoadingPhase(BlocklyManager);
