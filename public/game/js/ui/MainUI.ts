import UIComponent, { ButtonImage, UIImage } from "./UIComponent";
import UIScene from "../scenes/UIScene";
import IsoScene from "../IsoPlugin/IsoScene";
import CST from "../CST";
import UIComponentsFact from "./UIComponentsFactory";

type Image = Phaser.GameObjects.Image;
const Image = Phaser.GameObjects.Image;

export default class MainUI extends UIComponent {
  mainButtons: MainGameButtons;

  constructor(uiScene: UIScene, gameScene: IsoScene) {
    super(uiScene, gameScene);

    this.mainButtons = new MainGameButtons(uiScene);
  }

  // Enable the UI main buttons
  enable(): this {
    this.mainButtons.show();

    return this;
  }

  turnOff(): this {
    return this;
  }
}

const BUTTONS_CFG = CST.UI.MAIN_BUTTONS;

class MainUIButon extends ButtonImage {
  onHover = () => {
    this.setTint(BUTTONS_CFG.TINT_COLOR);
  };

  onHoverEnd = () => {
    this.setTint();
  };

  onTap = () => {};
}

// Add the Main Game Buttons to the UI Scene
class MainGameButtons {
  uiScene: UIScene;
  buttonsSizer: any;

  uiCompFact: UIComponentsFact = UIComponentsFact.getInstance();

  constructor(uiScene: UIScene) {
    this.uiScene = uiScene;

    let texture = this.uiCompFact.getTextureKey();
    this.initButtons(texture);
  }

  initButtons(textureKey: string): this {
    let background = new UIImage(
      this.uiScene,
      0,
      0,
      textureKey,
      this.uiCompFact.buttonsFrames[BUTTONS_CFG.BG_IMG]
    );

    // get the buttons imgs from their string keys
    let buttons = BUTTONS_CFG.BUTTON_IMGS.map(
      (buttonName: string): MainUIButon => {
        return new MainUIButon(
          this.uiScene,
          0,
          0,
          textureKey,
          buttonName
        ).setScale(BUTTONS_CFG.BTN_SCALE);
      }
    );

    // create the grid sizer holding the bg and the buttons
    this.buttonsSizer = this.uiScene.rexUI.add.gridSizer({
      anchor: BUTTONS_CFG.BG_ANCHOR,
      column: BUTTONS_CFG.BTNS_COLS,
      row: BUTTONS_CFG.BTNS_ROWS,
      width: background.width,
      height: background.height,
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

  show(): this {
    this.buttonsSizer.layout().setVisible(true);

    return this;
  }
}
