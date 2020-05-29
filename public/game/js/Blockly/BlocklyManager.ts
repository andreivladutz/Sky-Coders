import Manager from "../managers/Manager";
import Blockly from "blockly";
import * as JavaScript from "blockly/javascript";
import CST from "../CST";
import CodeInterpreter from "./CodeInterpreter";
import GameWindow from "../ui/GameWindow";
import Actor from "../gameObjects/Actor";

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

    window.addEventListener("load", () => {
      this.init();
      this.hideWorkspace();
    });
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

    this.window.closeWindow();
    this.currentActor.blocklyCode = this.getWorkspaceTextState();

    let code = this.getCode();
    this.currentActor.terminal.commandsHandler.outputRunningCode(
      code.split("\n")
    );

    let interpreter = this.currentActor.interpreter;
    interpreter.appendCode(code);

    try {
      while (interpreter.stepThroughCode());
    } catch (e) {
      console.warn("Error caught " + e.message);
    }
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

  private init() {
    this.initWorkspace();
    this.initDarkToggleButton();

    this.window = new GameWindow(
      document.getElementById(CST.BLOCKLY.CONTAINER_ID) as HTMLDivElement
    );

    this.window.on(CST.WINDOW.CLOSE_EVENT, this.closeWorkspace.bind(this));
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

  private initWorkspace() {
    this.workspace = Blockly.inject(CST.BLOCKLY.AREA_ID, {
      toolbox: document.getElementById(CST.BLOCKLY.TOOLBOX_ID),
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

  public static getInstance(): BlocklyManager {
    return super.getInstance() as BlocklyManager;
  }
}
