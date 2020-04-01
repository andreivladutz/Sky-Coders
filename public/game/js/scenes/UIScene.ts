import Phaser from "phaser";
import CST from "../CST";
import PwaHandler from "../managers/PwaHandler";

import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import IsoScene from "../IsoPlugin/IsoScene";
import { ISOMETRIC } from "../IsoPlugin/Projector";

import UIComponents from "../ui/UIComponentsFactory";

export default class UIScene extends IsoScene {
  rexUI: UIPlugin;
  buttonsContainer: any;

  // the game scene this UIScene is above
  gameScene: IsoScene;

  constructor() {
    const config = {
      key: CST.SCENES.UI
    };

    super(config);

    this.isometricType = ISOMETRIC;
  }

  preload() {
    super.preload();

    this.load.setBaseURL("./game/assets/");

    this.load.setPath("image/UI/");
    this.load.image("download", "download.png");
  }

  init() {
    this.scene.bringToTop();

    this.gameScene = this.scene.get(CST.SCENES.GAME) as IsoScene;
  }

  create() {
    // Set the projector's world origin
    this.iso.projector.origin.setTo(
      CST.PROJECTOR.ORIGIN.X,
      CST.PROJECTOR.ORIGIN.Y
    );

    this.handlePwaInstallation();

    UIComponents.initUIStateMachine(this, this.gameScene);
  }

  handlePwaInstallation() {
    // TODO: real button handler
    this.buttonsContainer = this.rexUI.add
      .buttons({
        x: 50,
        y: 50,
        orientation: "x",

        buttons: [this.add.image(0, 0, "download").setScale(0.05)],
        align: "center",
        click: {
          mode: "pointerup",
          clickInterval: 100
        }
      })
      .layout();

    this.add.existing(this.buttonsContainer);

    // hide install button
    this.buttonsContainer.hideButton(0);

    // when installation is available, show the button
    PwaHandler.setPromptHandler(e => {
      this.buttonsContainer.showButton(0);

      this.buttonsContainer.on("button.click", (button, idx) => {
        if (idx === 0) {
          e.prompt();

          this.buttonsContainer.hideButton(0);

          if (PwaHandler.wasInstallAccepted() === true) {
            console.log("User accepted install request");
          } else if (PwaHandler.wasInstallRefused() === true) {
            console.log("User refused install request");
          }
        }
      });
    });
  }
}
