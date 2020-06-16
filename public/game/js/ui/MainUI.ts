import UIComponent, { ButtonImage, UIImage } from "./uiUtils/UIComponent";
import UIScene from "../scenes/UIScene";
import IsoScene from "../IsoPlugin/IsoScene";
import CST from "../CST";
import UIComponentsFact from "./UIComponentsFactory";
import { MoveUIUtility, MoveUIDirection } from "./uiUtils/UIMovement";
import UIComponents from "./UIComponentsFactory";
import ActorsManager from "../managers/ActorsManager";
import SocketManager from "../online/SocketManager";
import BlocklyManager from "../Blockly/BlocklyManager";
import SVGObject from "./uiObjects/SVGObject";
import RoundRectObject from "./uiObjects/RoundRectObject";
import GameManager from "../online/GameManager";

type Image = Phaser.GameObjects.Image;
const Image = Phaser.GameObjects.Image;

export default class MainUI extends UIComponent {
  public mainButtons: MainGameButtons;
  public resources: ResourcesStatus;
  public blocklyManager: BlocklyManager;

  constructor(uiScene: UIScene, gameScene: IsoScene) {
    super(uiScene, gameScene);

    this.mainButtons = new MainGameButtons(uiScene, this);
    this.resources = new ResourcesStatus(uiScene, this);
    this.resources.updateCoinsValue(
      GameManager.getInstance().messengers.resources.initialResources.coins
    );

    this.blocklyManager = BlocklyManager.getInstance();
    this.blocklyManager.init(this.uiScene.cache);
  }

  // Enable the UI main buttons
  async enable(): Promise<void> {
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
  onTap = async () => {
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

        let blocklyManager = this.parentUI.blocklyManager;
        blocklyManager.showWorkspace(selectedActor.codeHandler);

        break;
    }
  };
}

const COINS = CST.UI.COINS;

class ResourcesStatus {
  uiScene: UIScene;
  mainUI: MainUI;

  // The object used as icon for the coins
  private coinsIcon: SVGObject;
  private coinsBg: RoundRectObject;

  private paddingSize: number;

  constructor(uiScene: UIScene, mainUI: MainUI) {
    this.uiScene = uiScene;
    this.mainUI = mainUI;

    this.initIcons();

    this.uiScene.scale.on("resize", this.repositionIcons, this);
  }

  public updateCoinsValue(coins: number): this {
    this.coinsBg.setText(`${coins} ${COINS.COINS_SUFFIX}`);
    this.repositionIcons();

    return this;
  }

  private initIcons() {
    // The size of the bottom tiled bar
    let { realHeight: height } = this.mainUI.mainButtons.bottomTileSize;
    let gameScale = this.uiScene.game.scale;
    let coinSize = height * COINS.RATIO;

    let goldCoinKey = `${COINS.PREFIX}${COINS.TYPES.GOLD.KEY}`;

    this.coinsIcon = new SVGObject(
      this.uiScene,
      gameScale.width,
      gameScale.height,
      goldCoinKey
    )
      .setOrigin(1, 0.5)
      .setWidth(coinSize);

    this.coinsBg = new RoundRectObject(
      this.uiScene,
      gameScale.width,
      gameScale.height
    )
      .setOrigin(1, 1)
      .setTextWithStyle(`0 ${COINS.COINS_SUFFIX}`, COINS.FONT_SIZE, "Odibee");

    // Fill the whole bottom bar
    this.paddingSize = (height - this.coinsBg.displayHeight) / 2;
    this.coinsBg
      .setPadding(this.paddingSize / 4)
      .setPadding(this.paddingSize, true);

    this.repositionIcons();
  }

  private repositionIcons() {
    // The size of the bottom tiled bar
    let { realHeight: height } = this.mainUI.mainButtons.bottomTileSize;
    let gameScale = this.uiScene.game.scale;
    let coinSize = height * COINS.RATIO;

    // Center the icon on the bottom bar
    this.coinsIcon.y = gameScale.height - coinSize + (height - coinSize) * 0.5;
    this.coinsBg.y = gameScale.height - this.paddingSize / 2;

    this.coinsBg.x = gameScale.width - this.paddingSize * 2;
    this.coinsIcon.x =
      this.coinsBg.x - this.coinsBg.displayWidth - this.paddingSize * 4;
  }
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

  // The size of the bottom ui tile
  public bottomTileSize: {
    realWidth: number;
    realHeight: number;
  };
  private plankFrame: string;

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

  private getPlankFrameSize(texture: string) {
    this.plankFrame = this.uiCompFact.buttonsFrames[
      CST.BUTTONS.TYPES.WOOD_PLANK
    ];
    // get the width and the height of the wood plank
    this.bottomTileSize = this.uiScene.textures.get(texture).frames[
      this.plankFrame
    ];
  }

  private tileBottomBar(texture: string): this {
    // Kill the old render texture with fire (this is being called again on game resize)
    if (this.tiledRenderTexture) {
      this.tiledRenderTexture.destroy();
    }

    if (!this.bottomTileSize) {
      this.getPlankFrameSize(texture);
    }

    let scale = this.uiScene.game.scale,
      { realWidth: width, realHeight: height } = this.bottomTileSize;

    this.tiledRenderTexture = this.uiScene.add
      .renderTexture(0, scale.height, scale.width, height)
      .setOrigin(0, 1)
      .setDepth(CST.UI.DEPTH.DECORATIONS)
      .setScale(1, BUTTONS_CFG.TILED_DECORATION_SCALE_Y);

    let noOfTiles = Math.round(scale.width / width);

    for (let i = 0; i <= noOfTiles; i++) {
      this.tiledRenderTexture.drawFrame(texture, this.plankFrame, i * width, 0);
    }

    return this;
  }
}
