import Manager from "../managers/Manager";
import Blockly, { Generator } from "blockly";
import CST from "../CST";
import GameWindow from "../ui/GameWindow";
import SYSTEM from "../system/system";
import CODE_CST from "./CODE_CST";

import defineCustomBlocks from "./Workspace/blockDefs/customBlocks";
import * as roLang from "blockly/msg/ro";
import * as enLang from "blockly/msg/en";
import ActorCodeHandler from "../gameObjects/ActorCodeHandler";
import ActorsManager from "../managers/ActorsManager";
import GameManager from "../online/GameManager";
import AudioManager from "../managers/AudioManager";

const JavaScript: Generator = (Blockly as any).JavaScript;

export default class BlocklyManager extends Manager {
  private readonly darkTheme: Blockly.Theme = (Blockly as any).Themes.Dark;
  private readonly classicTheme: Blockly.Theme = (Blockly as any).Themes
    .Classic;

  public workspace: Blockly.WorkspaceSvg;
  // The default workspace containing the three allowed command blocks
  private defaultXMLWorkspace: HTMLDocument;

  // The current actor's code Handler
  private currCodeHandler: ActorCodeHandler;

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
    this.workspace.clearUndo();
  }

  public getCode(): string {
    return JavaScript.workspaceToCode(this.workspace);
  }

  // Let the codeHandler process the top blocks in its workspace
  private sendWorkspaceToActor(codeHandler = this.currCodeHandler) {
    codeHandler.processTopBlocks(
      JavaScript,
      this.workspace,
      this.workspace.getTopBlocks(false)
    );
  }

  public closeWorkspace() {
    // Hide the button instantly
    this.darkModeToggleButton.style.display = "none";

    this.window.once(CST.WINDOW.CLOSE_ANIM_EVENT, () => {
      this.hideWorkspace();
    });

    // Save current's workspace state for this actor
    this.window.closeWindow();
    this.currCodeHandler.blocklyWorkspace = this.getWorkspaceTextState();

    this.sendWorkspaceToActor();

    // Stop sending updates to the db so often
    this.currCodeHandler.parentActor.clearIntervalDbUpdates();
  }

  // Show all workspace-related element with an animated transition
  // Opening the workspace for a specific actor
  public showWorkspace(codeHandler: ActorCodeHandler) {
    this.currCodeHandler = codeHandler;

    this.loadWorkspaceFromActor(codeHandler);

    this.window.once(CST.WINDOW.OPEN_ANIM_EVENT, () => {
      this.darkModeToggleButton.style.display = "";
    });

    this.window.openWindow();

    this.workspace.setVisible(true);
    Blockly.svgResize(this.workspace);

    // Send updates to the db more often to prevent code loss
    this.currCodeHandler.parentActor.setIntervalDbUpdates();
  }

  // Load the state stored as text for an actor
  private loadWorkspaceFromActor(codeHandler: ActorCodeHandler) {
    try {
      // If the actor has no code, init it to the default workspace
      if (!codeHandler.blocklyWorkspace) {
        Blockly.Xml.clearWorkspaceAndLoadFromXml(
          this.defaultXMLWorkspace.documentElement,
          this.workspace
        );

        codeHandler.blocklyWorkspace = Blockly.Xml.domToText(
          this.defaultXMLWorkspace.documentElement
        );
      } else {
        this.setWorkspaceStateFromText(codeHandler.blocklyWorkspace);
      }
    } catch {
      this.workspace.clear();
    }
  }

  // Close and hide all workspace-related element
  private hideWorkspace() {
    this.workspace.setVisible(false);

    this.darkModeToggleButton.style.display = "none";
  }

  // Init should be called before using the workspace! (It is called by the ActorsManager after initing all actors)
  // The toolbox xml is being loaded by Phaser's loader and taken from Phaser's cache
  // The init method HAS to be called after all actors have been created as it loads the code from their workspace
  public init(cache: Phaser.Cache.CacheManager) {
    let toolboxXml = cache.xml.get(this.toolboxKey);
    this.defaultXMLWorkspace = cache.xml.get(this.defaultWorkspaceKey);

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

    this.reloadAllCode();
  }

  // Reload all code / code commands and code events for all actors in the scene
  private reloadAllCode() {
    for (let actor of ActorsManager.getInstance().sceneActors) {
      this.loadWorkspaceFromActor(actor.codeHandler);
      this.sendWorkspaceToActor(actor.codeHandler);
    }
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

  // Internal inter
  private addReservedWords() {
    // Don't let the user use __chara__, self and others in his code anywhere
    JavaScript.addReservedWords(CODE_CST.RESERVED_WORDS);
  }

  // Translate the label tags' text in the Blockly toolbox
  private localizeLabels(toolboxXml: HTMLDocument) {
    let langFile = GameManager.getInstance().langFile;
    let textAttribToLocalized = [
      [CST.BLOCKLY.LABELS.COORDS, langFile.Blockly.labels.coords],
      [CST.BLOCKLY.LABELS.BUILDINGS, langFile.Blockly.labels.builds]
    ];

    for (let [textAttrib, localizedText] of textAttribToLocalized) {
      toolboxXml
        .querySelectorAll(`label[text="${textAttrib}"`)[0]
        .setAttribute("text", localizedText);
    }
  }

  // Synchronize the volume with the audio manager volume
  private synchronizeVolume() {
    let wksAudio = this.workspace.getAudioManager();

    let oldPlay = wksAudio.play;
    wksAudio.play = (name: string) => {
      oldPlay.call(wksAudio, name, AudioManager.getInstance().volume);
    };
  }

  private initWorkspace(toolboxXml: HTMLDocument) {
    let startScale = SYSTEM.TOUCH_ENABLED
      ? CST.BLOCKLY.MOBILE_INITIAL_SCALE
      : CST.BLOCKLY.INITIAL_SCALE;

    this.localizeLabels(toolboxXml);

    this.workspace = Blockly.inject(CST.BLOCKLY.AREA_ID, {
      toolbox: toolboxXml.getElementById(CST.BLOCKLY.TOOLBOX_ID),
      // horizontalLayout: true,
      theme: this.darkTheme,
      zoom: {
        controls: true,
        startScale
      },
      move: {
        scrollbars: true,
        drag: true
      },
      trashcan: false,
      renderer: "zelos"
    });

    this.synchronizeVolume();

    this.workspace.addChangeListener(Blockly.Events.disableOrphans);
    this.addReservedWords();
  }

  // Init the custom Blockly blocks from the loaded json defs (already parsed)
  private initBlocks(cache: Phaser.Cache.CacheManager) {
    let blockDefs: Object[] = [];

    for (let blockDefKey of this.blockDefsJsonKeys) {
      blockDefs = blockDefs.concat(cache.json.get(blockDefKey));
    }

    // TODO: Change the custom block localization. No need to import all locales
    defineCustomBlocks(blockDefs, {
      RO: roLang,
      EN: enLang
    });

    let chosenLangCode = GameManager.getInstance().chosenLangCode;
    switch (chosenLangCode) {
      case CST.LANGUAGE_CODES.ROMANIAN:
        Blockly.setLocale(roLang);
        break;
      case CST.LANGUAGE_CODES.ENGLISH:
      default:
        Blockly.setLocale(enLang);
    }
  }

  // Load the toolbox xml
  public async preload(load: Phaser.Loader.LoaderPlugin) {
    this.loadResources(load);
  }

  // Load the toolbox, default workspace and blocks json definitions
  loadResources(load: Phaser.Loader.LoaderPlugin) {
    const { RESOURCES } = CST.BLOCKLY;
    const { BLOCKS } = RESOURCES;

    // The path to the toolbox
    load.setPath(RESOURCES.PATH);
    load.setPrefix(RESOURCES.BLOCKLY_PREFIX);

    load.xml(RESOURCES.TOOLBOX_KEY, RESOURCES.TOOLBOX_XML);
    // Load the default workspace that has the three allowed command blocks
    load.xml(RESOURCES.WORKSPACE_KEY, RESOURCES.DEFAULT_WORKSPACE_XML);

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

  private get defaultWorkspaceKey() {
    const { RESOURCES: RESOURCES } = CST.BLOCKLY;

    return `${RESOURCES.BLOCKLY_PREFIX}${RESOURCES.WORKSPACE_KEY}`;
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
