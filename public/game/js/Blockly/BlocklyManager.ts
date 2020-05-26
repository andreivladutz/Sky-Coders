import Manager from "../managers/Manager";
import Blockly from "blockly";
import * as JavaScript from "blockly/javascript";
import CST from "../CST";
import CodeBridge from "./CodeBridge";

export default class BlocklyManager extends Manager {
  private readonly darkTheme: Blockly.Theme = (Blockly as any).Themes.Dark;
  private readonly classicTheme: Blockly.Theme = (Blockly as any).Themes
    .Classic;

  public workspace: Blockly.WorkspaceSvg;

  private darkModeToggleButton: HTMLButtonElement;
  private blocklyContainer: HTMLDivElement;

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

  public toggleWorkspace() {
    if (this.workspace.isVisible()) {
      this.closeWorkspace();
    } else {
      this.showWorkspace();
    }
  }

  // Add the animation class so a transition is animated via css
  // After the css animation end, hide the workspace completely
  public closeWorkspace() {
    // Add the class and attribute used by the css animation
    this.blocklyContainer.classList.add(CST.BLOCKLY.ANIMATION.CLASS);
    this.blocklyContainer.setAttribute(CST.BLOCKLY.ANIMATION.ATTRIB, "true");

    // Hide the button instantly
    this.darkModeToggleButton.style.display = "none";

    this.callbackOnAnimationEnd(() => {
      this.hideWorkspace();
    });

    let code = this.getCode();
    console.log(code);
    let codeBridge = new CodeBridge(code);

    try {
      while (codeBridge.stepThroughCode());
    } catch (e) {
      console.warn("Error caught " + e.message);
    }
  }

  // Call cb back when the css animation ends
  private callbackOnAnimationEnd(cb) {
    let computedStyle = getComputedStyle(this.blocklyContainer);

    let interval = setInterval(() => {
      if (computedStyle.animationPlayState === "running") {
        clearInterval(interval);

        cb();

        this.blocklyContainer.classList.remove(CST.BLOCKLY.ANIMATION.CLASS);
        this.blocklyContainer.removeAttribute(CST.BLOCKLY.ANIMATION.ATTRIB);
      }
    }, 250);
  }

  // Show all workspace-related element with an animated transition
  public showWorkspace() {
    this.blocklyContainer.classList.add(CST.BLOCKLY.ANIMATION.CLASS);
    this.blocklyContainer.setAttribute(CST.BLOCKLY.ANIMATION.ATTRIB, "false");

    this.callbackOnAnimationEnd(() => {
      this.darkModeToggleButton.style.display = "";
    });

    this.workspace.setVisible(true);
    this.blocklyContainer.style.display = "";

    Blockly.svgResize(this.workspace);
  }

  // Close and hide all workspace-related element
  private hideWorkspace() {
    this.workspace.setVisible(false);

    this.darkModeToggleButton.style.display = "none";
    this.blocklyContainer.style.display = "none";
  }

  private init() {
    this.initWorkspace();
    this.initDarkToggleButton();
    this.initContainerElement();
  }

  private initContainerElement() {
    this.blocklyContainer = document.getElementById(
      CST.BLOCKLY.CONTAINER_ID
    ) as HTMLDivElement;

    this.blocklyContainer.onclick = e => {
      e.stopPropagation();

      if (e.target === this.blocklyContainer) {
        this.closeWorkspace();
      }
    };
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
