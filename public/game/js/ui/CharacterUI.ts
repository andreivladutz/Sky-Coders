import UIComponent from "./uiUtils/UIComponent";
import CST from "../CST";
import Actor from "../gameObjects/Actor";
import UIScene from "../scenes/UIScene";
import IsoScene from "../IsoPlugin/IsoScene";
import { CodeCommand } from "../gameObjects/ActorCodeHandler";
import CameraManager from "../managers/CameraManager";

export default class CharacterUI extends UIComponent {
  private characterContainer: HTMLDivElement;
  private terminalButton: HTMLButtonElement;
  private selectedCharaHead: HTMLDivElement;

  // The ui Menu from rexplugins
  private commandsMenu: any;
  private commandsMenuClosed: boolean = true;

  public constructor(uiScene: UIScene, gameScene: IsoScene) {
    super(uiScene, gameScene);

    this.characterContainer = document.getElementById(
      CST.CHARA_SELECTION.CONTAINER_ID
    ) as HTMLDivElement;

    this.terminalButton = document.getElementById(
      CST.CHARA_SELECTION.TERMINAL_BTN_ID
    ) as HTMLButtonElement;

    this.selectedCharaHead = document.getElementById(
      CST.CHARA_SELECTION.CHARA_HEAD_ID
    ) as HTMLDivElement;

    this.uiScene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.commandsMenu || this.commandsMenuClosed) {
        return;
      }

      if (!this.commandsMenu.isInTouching(pointer)) {
        this.closeCommandMenu();
      }
    });

    CameraManager.EVENTS.on(CST.CAMERA.DEBOUNCED_MOVE_EVENT, () => {
      if (!this.commandsMenu || this.commandsMenuClosed) {
        return;
      }

      this.closeCommandMenu();
    });

    CameraManager.EVENTS.on(CST.CAMERA.ZOOM_EVENT, () => {
      if (!this.commandsMenu || this.commandsMenuClosed) {
        return;
      }

      this.closeCommandMenu();
    });
  }

  public enable(selectedActor: Actor) {
    this.characterContainer.style.display = "";

    this.terminalButton.onclick = () => {
      selectedActor.codeHandler.terminal.open();
    };

    this.selectedCharaHead.onclick = () => {
      selectedActor.focusCamera();
    };

    super.enable();
  }

  public turnOff() {
    super.turnOff();

    this.characterContainer.style.display = "none";
    this.destroyCommandsMenu();
  }

  // Open the command menu at (x, y) coordinates
  public showCommandsMenu(actor: Actor, x: number, y: number) {
    this.destroyCommandsMenu();
    this.createCmdsMenu(actor, x, y);

    this.commandsMenuClosed = false;
  }

  public closeCommandMenu() {
    this.commandsMenu.collapse();
    this.commandsMenuClosed = true;
  }

  private destroyCommandsMenu() {
    if (!this.commandsMenu) {
      return;
    }

    // Destroy the commands menu to free memory
    this.removeMenuListeners();
    this.commandsMenu.destroy();
    delete this.commandsMenu;
    this.commandsMenu = null;

    this.commandsMenuClosed = true;
  }

  // Add the event listeners related to the actual cmds menu
  private addMenuListeners(selectedActor: Actor) {
    // Button handlers
    this.commandsMenu
      .on("button.over", function(button: any) {
        button
          .getElement("background")
          .setDepth(CST.CHARA_SELECTION.UI.BTN_BG_DEPTH)
          .setStrokeStyle(1, 0xffffff);

        button
          .getElement("text")
          .setDepth(CST.CHARA_SELECTION.UI.BTN_TEXT_DEPTH);
      })
      .on("button.out", function(button: any) {
        button
          .getElement("background")
          .setDepth(0)
          .setStrokeStyle();

        button.getElement("text").setDepth(0);
      })
      // When a command is chosen, run it
      .on("button.click", (_button: any, index: number) => {
        selectedActor.codeHandler.runBlocklyCommand(index);

        this.closeCommandMenu();
      });
  }

  // Remove the listeners related to this menu as a new one
  // Is recreated each time a character is selected
  private removeMenuListeners() {
    this.commandsMenu.removeAllListeners();
  }

  private createCmdsMenu(selectedActor: Actor, x: number, y: number) {
    this.commandsMenu = this.uiScene.rexUI.add.menu({
      items: selectedActor.codeHandler.codeCommands,
      createButtonCallback: this.createCommandBtn,
      createButtonCallbackScope: this,
      easeIn: {
        duration: 500,
        orientation: "y"
      },

      easeOut: {
        duration: 100,
        orientation: "y"
      }
    });

    // Offset the menu position such that it's over the actor
    // let camera = CameraManager.getInstance().camera;
    // let originPoint = camera.getWorldPoint(0, 0);

    // this.commandsMenu.x = (x - originPoint.x) * camera.zoom;
    // this.commandsMenu.y = (y - originPoint.y) * camera.zoom;
    this.commandsMenu.x = x;
    this.commandsMenu.y = y;

    this.addMenuListeners(selectedActor);
  }

  private createCommandBtn(item: CodeCommand, index: number) {
    let spaceSizeW = this.ratioOfWidth(CST.CHARA_SELECTION.UI.CMDS_SPACE_RATIO);
    let spaceSizeH = this.ratioOfHeight(
      CST.CHARA_SELECTION.UI.CMDS_SPACE_RATIO
    );

    let fontSize = Math.floor(
      this.ratioOfHeight(CST.CHARA_SELECTION.UI.FONT_RATIO)
    );

    return this.uiScene.rexUI.add.label({
      background: this.uiScene.rexUI.add.roundRectangle(
        0,
        0,
        2,
        2,
        0,
        0x4e342e
      ),
      text: this.uiScene.add.text(0, 0, item.name, {
        fontSize: `${fontSize}px`,
        fontFamily: "Roboto"
      }),
      space: {
        left: spaceSizeW,
        right: spaceSizeW,
        top: spaceSizeH,
        bottom: spaceSizeH
      }
    });
  }
}
