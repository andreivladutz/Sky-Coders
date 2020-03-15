import Phaser from "phaser";
import CST from "../CST";
import PwaHandler from "../managers/PwaHandler";

import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";

export default class UIScene extends Phaser.Scene {
  rexUI: UIPlugin;
  buttonsContainer: any;

  constructor() {
    const config = {
      key: CST.SCENES.UI
    };

    super(config);
  }

  preload() {
    this.load.setBaseURL("./game/assets/");

    this.load.setPath("image/UI/");
    this.load.image("download", "download.png");
  }

  init() {
    this.scene.bringToTop();
  }

  create() {
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
