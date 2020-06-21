import UIScene from "../../scenes/UIScene";
import CST from "../../CST";
import UIComponents from "../UIComponentsFactory";

// A pop-up message class
export default class Toast {
  private toast: any;
  private uiScene: UIScene;
  private lastShown = 0;

  constructor(uiScene: UIScene) {
    this.uiScene = uiScene;
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

  private repositionToast() {
    let uiComps = UIComponents.getInstance();
    let cancelBtnFrame = uiComps.buttonsFrames[CST.BUTTONS.TYPES.CANCEL];
    let texture = uiComps.getTextureKey();
    // get the the height of the cancel button
    let { width, height } = this.uiScene.textures.get(texture).frames[
      cancelBtnFrame
    ];
    let { width: gameWidth } = this.uiScene.game.scale.gameSize;

    console.log(this.toast);
    this.toast._y = height * 1.2;
    this.toast._x = gameWidth / 2 + width;
  }
}
