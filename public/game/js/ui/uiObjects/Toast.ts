import UIScene from "../../scenes/UIScene";
import CST from "../../CST";
import UIComponents from "../UIComponentsFactory";
import BuildMenuUI from "../BuildMenuUI";
import IsoScene from "../../IsoPlugin/IsoScene";

// TODO: Adapt fontsize to the screen
// TODO: hide coins that appear over the toast
// A pop-up message class
export default class Toast {
  private toast: any;
  private uiScene: UIScene;
  private gameScene: IsoScene;
  private lastShown = 0;

  constructor(uiScene: UIScene, gameScene: IsoScene) {
    this.uiScene = uiScene;
    this.gameScene = gameScene;

    this.toast = this.uiScene.rexUI.add.toast({
      anchor: {
        left: "center",
        top: "0%"
      },
      background: this.uiScene.rexUI.add.roundRectangle(
        0,
        0,
        2,
        2,
        20,
        CST.COLORS.MAROON
      ),
      text: this.uiScene.add.text(0, 0, "", {
        fontSize: "24px",
        fontFamily: "Roboto"
      }),
      space: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 20
      },

      duration: {
        in: CST.UI.TOAST.TRANSITION_TIME,
        hold: CST.UI.TOAST.DISPLAY_TIME,
        out: CST.UI.TOAST.TRANSITION_TIME
      }
    });
  }

  public showMsg(text: string) {
    // Don't let the messages stack up
    if (
      Date.now() - this.lastShown <
      CST.UI.TOAST.TRANSITION_TIME * 2 + CST.UI.TOAST.DISPLAY_TIME
    ) {
      return;
    }
    this.lastShown = Date.now();

    this.toast.show(text);
    this.repositionToast();
  }

  // Reposition the toast on each message show
  private repositionToast() {
    let buildMenuUi = UIComponents.getUIComponents(
      BuildMenuUI,
      this.uiScene,
      this.gameScene
    )[0];

    let offsetWidth = 0,
      offsetHeight = 0;
    // If the build menu is enabled, offset the toast messages so they don't overlap the cancel / ok buttons
    if (buildMenuUi.isEnabled) {
      let uiComps = UIComponents.getInstance();
      let cancelBtnFrame = uiComps.buttonsFrames[CST.BUTTONS.TYPES.CANCEL];
      let texture = uiComps.getTextureKey();
      // get the the height of the cancel button
      ({ width: offsetWidth, height: offsetHeight } = this.uiScene.textures.get(
        texture
      ).frames[cancelBtnFrame]);
    }

    let { width: gameWidth } = this.uiScene.game.scale.gameSize;

    this.toast._y = offsetHeight / 2 + this.toast.childrenHeight;
    this.toast._x = gameWidth / 2 + offsetWidth;
  }
}
