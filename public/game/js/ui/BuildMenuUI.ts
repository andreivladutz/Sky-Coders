import UIComponent from "./uiUtils/UIComponent";
import ButtonImage from "./uiObjects/ButtonImage";
import UIScene from "../scenes/UIScene";
import IsoScene from "../IsoPlugin/IsoScene";
import CST from "../CST";
import BuildingsManager from "../managers/BuildingsManager";
import { MoveUIUtility, MoveUIDirection } from "./uiUtils/UIMovement";
import UIComponents from "./UIComponentsFactory";
import BuildPlaceUI from "./BuildPlaceUI";
import { BuildNames } from "../../../common/BuildingTypes";
import GameManager from "../online/GameManager";
import MainUI from "./MainUI";

const BUILD_MENU = CST.UI.BUILD_MENU;

// Side menu buttons that will hold the buildings to be build
// They hold a parentReference to the BuildMenuUI
class SideMenuButton extends ButtonImage<BuildMenuUI> {
  // define the logic for button clicking
  onTap = () => {
    let buildingNames = Object.values(BuildNames);
    let stateMachine = UIComponents.getUIStateMachine();

    switch (this.btnName) {
      case CST.BUTTONS.TYPES.CANCEL:
        stateMachine.transitionTo(CST.STATES.MAIN_UI);
        break;
      // The user wants to place down the building. Check if it can be placed
      case CST.BUTTONS.TYPES.OK:
        // can the building be placed?
        let placeable = this.parentUI.buildPlaceUI.checkBuildingPlaceable();

        if (placeable) {
          // Place the building and transition to the build menu state
          stateMachine.transitionTo(CST.STATES.BUILD_MENU);
        } else {
          let langFile = GameManager.getInstance().langFile;
          let mainUi = UIComponents.getUIComponents(
            MainUI,
            this.parentUI.uiScene,
            this.parentUI.gameScene
          )[0] as MainUI;
          mainUi.toast.showMsg(langFile.buildings.cannotPlace);
        }

        break;
      // check if it's a building button
      default:
        for (let buildingName of buildingNames) {
          if (this.btnName === buildingName) {
            stateMachine.transitionTo(CST.STATES.BUILD_PLACING, buildingName);
          }
        }
    }
  };
}

export default class BuildMenuUI extends UIComponent {
  scrollPanel: any;
  // the sizer holding the Ok and Cancel buttons
  confirmSizer: any;
  // index of the ok button
  okButtonIdx: number;
  okButton: SideMenuButton;

  buildPlaceUI: BuildPlaceUI;

  constructor(uiScene: UIScene, gameScene: IsoScene) {
    super(uiScene, gameScene);

    [this.buildPlaceUI] = UIComponents.getUIComponents(
      BuildPlaceUI,
      this.uiScene,
      this.gameScene
    ).map((buildUI): BuildPlaceUI => buildUI as BuildPlaceUI);

    this.createSidePanel().createConfirmButtons();

    // Resize the side menu on game resize
    this.uiScene.scale.on("resize", () => {
      let gameScale = this.uiScene.game.scale;

      this.scrollPanel.layout(undefined, undefined, gameScale.height);
      //let slider = this.scrollPanel.childrenMap.slider;
    });
  }

  enable(): Promise<void> {
    super.enable();
    // show the side menu
    this.scrollPanel.setVisible(true);
    // show the confirmation buttons
    this.confirmSizer.setVisible(true);

    this.moveConfirmBtnsDown();

    return this.moveRight();
  }

  // animate the movement out of the screen, the hide
  async turnOff(): Promise<void> {
    this.moveConfirmBtnsUp().then(() => {
      this.confirmSizer.setVisible(false).layout();
    });

    await this.moveLeft();
    super.turnOff();
    this.scrollPanel.setVisible(false).layout();
  }

  // when entering build placing mode, show the ok button
  public showOkButton(): this {
    this.okButton.setVisible(true);
    this.confirmSizer.showButton(this.okButtonIdx).layout();

    return this;
  }

  // when exiting build placing mode, hide the ok button
  public hideOkButton(): this {
    this.okButton.setVisible(false);
    this.confirmSizer.hideButton(this.okButtonIdx).layout();

    return this;
  }

  // move Right animation for the Menu
  public moveRight(): Promise<void> {
    return MoveUIUtility.MoveUI(
      this.uiScene,
      this.scrollPanel,
      MoveUIDirection.RIGHT
    );
  }

  // move Left animation for the Menu
  public moveLeft(): Promise<void> {
    return MoveUIUtility.MoveUI(
      this.uiScene,
      this.scrollPanel,
      MoveUIDirection.LEFT
    );
  }

  // move up the confirmation buttons
  public moveConfirmBtnsUp(): Promise<void> {
    return MoveUIUtility.MoveUI(
      this.uiScene,
      this.confirmSizer,
      MoveUIDirection.DOWN,
      // start immediately, don't push it in the queue to wait
      false,
      // same hack as for downward movement
      -CST.UI.MOVEMENT.DEFAULT_DISTANCE
    );
  }

  // move down the confirmation buttons
  public moveConfirmBtnsDown(): Promise<void> {
    return MoveUIUtility.MoveUI(
      this.uiScene,
      this.confirmSizer,
      // a little hack to make it work
      // tell it to go up but provide a negative distance to go down
      MoveUIDirection.UP,
      false,
      -CST.UI.MOVEMENT.DEFAULT_DISTANCE
    );
  }

  // create and add to the scene the confirmation buttons at the top of the screen
  createConfirmButtons(): this {
    const CFG = CST.UI.CONFIRM_BUTTONS;

    let buttons = [CST.BUTTONS.TYPES.OK, CST.BUTTONS.TYPES.CANCEL].map(
      (btnName, idx) => {
        let btn = new SideMenuButton(
          this.uiScene,
          this,
          0,
          0,
          UIComponents.getInstance().getTextureKey(),
          btnName
        ).setScale(CFG.SCALE);

        // remember the ok button so we can hide it
        if (idx === 0) {
          this.okButton = btn.setVisible(false);
        }

        return btn;
      }
    );

    // the ok button is the first in the buttons list
    this.okButtonIdx = 0;

    this.confirmSizer = this.uiScene.rexUI.add
      .buttons({
        // position
        anchor: CFG.ANCHOR,
        orientation: CFG.ORIENTATION,
        space: CFG.SPACE,
        align: CFG.ALIGN,
        buttons
      })
      // the ok button is hidden
      .hideButton(this.okButtonIdx)
      .layout()
      .setVisible(false);

    this.uiScene.add.existing(this.confirmSizer);

    return this;
  }

  // create the side panel to the left, maroon background, a slider
  // and push all buildings' frames into it so they can be built
  private createSidePanel(): this {
    let gameScale = this.uiScene.game.scale;

    this.scrollPanel = this.uiScene.rexUI.add
      .scrollablePanel({
        anchor: BUILD_MENU.ANCHOR,
        height: gameScale.height,
        scrollMode: BUILD_MENU.SCROLL_MODE,
        background: this.uiScene.rexUI.add.roundRectangle(
          0,
          0,
          2,
          2,
          15,
          CST.COLORS.MAROON
        ),
        panel: {
          child: this.getBuildingsSizer(),
          mask: {
            padding: 1
          }
        },
        slider: this.getSlider(),
        space: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10,

          panel: 10
        }
      })
      .layout()
      .setDepth(CST.UI.DEPTH.BG)
      .setVisible(false);

    this.uiScene.add.existing(this.scrollPanel);
    return this;
  }

  private getBuildingsSizer() {
    let sizer = this.uiScene.rexUI.add.sizer({
      orientation: BUILD_MENU.SIZER.ORIENTATION
    });

    this.initBuildingsButtons(sizer);

    return sizer;
  }

  // Pushes each frame of the buildings to the sizer holding
  // the buttons for the side menu
  private initBuildingsButtons(sizer: any) {
    const buildingManager = BuildingsManager.getInstance();
    let textureKey = buildingManager.getTextureKey();

    // Compute the size of the buttons relative to the game screen,
    // relative to the first building button
    let firstFrameName =
      buildingManager.buildingFrames[Object.values(BuildNames)[0]];
    let firstFrameWidth = this.gameScene.textures.getFrame(
      textureKey,
      firstFrameName
    ).width;
    let gameWidth = this.gameScene.game.scale.width;

    let scaleRatio = (gameWidth / firstFrameWidth) * BUILD_MENU.BUTTONS_SIZE;

    for (let frameName of Object.values(BuildNames)) {
      let buttonImage = new SideMenuButton(
        this.uiScene,
        this,
        0,
        0,
        textureKey,
        frameName,
        buildingManager.buildingFrames[frameName]
      ).setScale(scaleRatio);

      sizer.add(buttonImage);
    }
  }

  // the slider used to scroll the side menu
  private getSlider() {
    return {
      track: this.uiScene.rexUI.add.roundRectangle(
        0,
        0,
        20,
        10,
        10,
        CST.COLORS.DARK_MAROON
      ),
      thumb: this.uiScene.rexUI.add.roundRectangle(
        0,
        0,
        0,
        0,
        13,
        CST.COLORS.LIGHT_MAROON
      )
    };
  }
}
