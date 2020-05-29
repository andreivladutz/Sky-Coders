import UIComponent, { ButtonImage, UIImage } from "./UIComponent";
import UIScene from "../scenes/UIScene";
import IsoScene from "../IsoPlugin/IsoScene";
import CST from "../CST";
import UIComponentsFact from "./UIComponentsFactory";
import { MoveUIUtility, MoveUIDirection } from "./UIMovement";
import UIComponents from "./UIComponentsFactory";
import UIStateMachine from "./UIStateMachine";
import BlocklyManager from "../Blockly/BlocklyManager";
import ActorsManager from "../managers/ActorsManager";
import SocketManager from "../online/SocketManager";

type Image = Phaser.GameObjects.Image;
const Image = Phaser.GameObjects.Image;

export default class MainUI extends UIComponent {
  mainButtons: MainGameButtons;

  constructor(uiScene: UIScene, gameScene: IsoScene) {
    super(uiScene, gameScene);

    this.mainButtons = new MainGameButtons(uiScene, this);
  }

  // Enable the UI main buttons
  enable(): Promise<void> {
    return this.mainButtons.show();
  }

  turnOff(): Promise<void> {
    // hide the main buttons
    return this.mainButtons.hide();
  }

  /* the Handling logic of each main button:*/

  // pass the control to the build ui
  handleBuildButton() {
    UIComponents.getUIStateMachine().transitionTo(CST.STATES.BUILD_MENU);
  }
}

const BUTTONS_CFG = CST.UI.MAIN_BUTTONS,
  BUTTON_TYPES = CST.BUTTONS.TYPES;

class MainUIButon extends ButtonImage<MainUI> {
  onHover() {
    super.onHover();
  }

  onHoverEnd() {
    super.onHoverEnd();
  }

  // define the logic for button clicking
  onTap = () => {
    switch (this.btnName) {
      case BUTTON_TYPES.BUILD:
        this.parentUI.handleBuildButton();
        break;

      case BUTTON_TYPES.LOGOUT:
        SocketManager.getInstance().redirectClient(
          CST.COMMON_CST.CONNECTION.LOGOUT_PATH
        );
        break;

      case BUTTON_TYPES.SCRIPT:
        let selectedActor = ActorsManager.getInstance().selectedActor;

        if (!selectedActor) {
          // TODO: TOAST "NO ACTOR IS SELECTED"
          return;
        }

        BlocklyManager.getInstance().showWorkspace(selectedActor);
        break;
    }
  };
}

// Add the Main Game Buttons to the UI Scene
class MainGameButtons {
  uiScene: UIScene;
  // the buttons and bg container
  buttonsSizer: any;
  // the ui components singleton instance
  uiCompFact: UIComponentsFact = UIComponentsFact.getInstance();
  // the render texture holding the bottom bar
  tiledRenderTexture: Phaser.GameObjects.RenderTexture;
  // keep a reference to the mainUi class
  mainUI: MainUI;

  constructor(uiScene: UIScene, mainUI: MainUI) {
    this.uiScene = uiScene;
    this.mainUI = mainUI;

    let texture = this.uiCompFact.getTextureKey();
    this.initButtons(texture).tileBottomBar(texture);

    // when the game resizes reposition the wooden bottom bar
    this.uiScene.scale.on("resize", this.tileBottomBar.bind(this, texture));
  }

  initButtons(textureKey: string): this {
    let background = new UIImage(
      this.uiScene,
      0,
      0,
      textureKey,
      this.uiCompFact.buttonsFrames[BUTTONS_CFG.BG_IMG]
    )
      .setScale(1, BUTTONS_CFG.BG_SCALE_Y)
      .setDepth(CST.UI.DEPTH.BG);

    // get the buttons imgs from their string keys
    let buttons = BUTTONS_CFG.BUTTON_IMGS.map(
      (buttonName: string): MainUIButon => {
        return new MainUIButon(
          this.uiScene,
          this.mainUI,
          0,
          0,
          textureKey,
          buttonName
        )
          .setScale(BUTTONS_CFG.BTN_SCALE)
          .setDepth(CST.UI.DEPTH.BUTTONS);
      }
    );

    // create the grid sizer holding the bg and the buttons
    this.buttonsSizer = this.uiScene.rexUI.add.gridSizer({
      anchor: BUTTONS_CFG.BG_ANCHOR,
      column: BUTTONS_CFG.BTNS_COLS,
      row: BUTTONS_CFG.BTNS_ROWS,
      width: background.displayWidth,
      height: background.displayHeight,
      columnProportions: background.width / buttons[0].displayWidth,
      rowProportions: background.height / buttons[0].displayHeight
    });

    // add bg and images
    this.buttonsSizer.addBackground(background);

    buttons.forEach((image: Image, idx: number) => {
      this.buttonsSizer.add(
        image,
        idx % BUTTONS_CFG.BTNS_COLS,
        Math.floor(idx / BUTTONS_CFG.BTNS_COLS),
        BUTTONS_CFG.ALIGN_BTN,
        // no padding
        0,
        BUTTONS_CFG.EXPAND_BTN
      );
    });

    // add the sizer to the scene
    this.uiScene.add.existing(this.buttonsSizer.setVisible(false));

    return this;
  }

  // move Up animation for the buttons
  public moveUp(): Promise<void> {
    return MoveUIUtility.MoveUI(
      this.uiScene,
      this.buttonsSizer,
      MoveUIDirection.UP
    );
  }

  // move Down animation for the buttons
  public moveDown(): Promise<void> {
    return MoveUIUtility.MoveUI(
      this.uiScene,
      this.buttonsSizer,
      MoveUIDirection.DOWN
    );
  }

  show(): Promise<void> {
    this.buttonsSizer.layout().setVisible(true);

    return this.moveUp();
  }

  async hide(): Promise<void> {
    await this.moveDown();

    this.buttonsSizer.setVisible(false);
  }

  private tileBottomBar(texture: string): this {
    // destroy the old render texture (this is being called again on game resize)
    if (this.tiledRenderTexture) {
      this.tiledRenderTexture.destroy();
    }

    let scale = this.uiScene.game.scale,
      frame = this.uiCompFact.buttonsFrames[CST.BUTTONS.TYPES.WOOD_PLANK];

    // get the width and the height of the wood plank
    let { realWidth: width, realHeight: height } = this.uiScene.textures.get(
      texture
    ).frames[frame];

    this.tiledRenderTexture = this.uiScene.add
      .renderTexture(0, scale.height, scale.width, height)
      .setOrigin(0, 1)
      .setDepth(CST.UI.DEPTH.DECORATIONS)
      .setScale(1, BUTTONS_CFG.TILED_DECORATION_SCALE_Y);

    let noOfTiles = Math.round(scale.width / width);

    for (let i = 0; i <= noOfTiles; i++) {
      this.tiledRenderTexture.drawFrame(texture, frame, i * width, 0);
    }

    return this;
  }
}
