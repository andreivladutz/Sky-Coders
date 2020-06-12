import IsoScene from "../../IsoPlugin/IsoScene";
import UIScene from "../../scenes/UIScene";
import UIComponents from "../UIComponentsFactory";
import CST from "../../CST";

export default abstract class UIComponent {
  // Keep track of the UIScene, as well as the gameScene
  uiScene: UIScene;
  gameScene: IsoScene;

  abstract enable(...args: any[]): any;
  abstract turnOff(...args: any[]): any;

  constructor(uiScene: UIScene, gameScene: IsoScene) {
    this.uiScene = uiScene;
    this.gameScene = gameScene;
  }

  // Get a ratio of the screen width
  ratioOfWidth(ratio: number) {
    return this.uiScene.game.scale.gameSize.width * ratio;
  }

  // Get a ratio of the screen height
  ratioOfHeight(ratio: number) {
    return this.uiScene.game.scale.gameSize.height * ratio;
  }
}

const Image = Phaser.GameObjects.Image;

// static UI element that just prevents propagating events
export class UIImage extends Image {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame);

    scene.add.existing(this);

    this.enableInput();
  }

  protected enableInput() {
    this.setInteractive()
      .on("pointermove", preventAndCallbackHandler())
      .on("pointerdown", preventAndCallbackHandler());
  }
}

// button identifier
export class ButtonImage<T extends UIComponent> extends UIImage {
  // a reference to the parent UI
  parentUI: T;
  btnName: string;

  // default behaviour is to tint the button
  onHover() {
    this.setTint(CST.UI.BUTTONS.TINT_COLOR);
  }

  // default behaviour is to clear the tint
  onHoverEnd() {
    this.setTint();
  }

  onTap: () => void;

  constructor(
    scene: UIScene,
    parentUI: T,
    x: number,
    y: number,
    texture: string,
    btnName: string,
    frame?: string | number
  ) {
    super(
      scene,
      x,
      y,
      texture,
      frame ? frame : UIComponents.getInstance().buttonsFrames[btnName]
    );

    this.parentUI = parentUI;
    this.btnName = btnName;
  }

  protected enableInput() {
    this.setInteractive()
      .on("pointerover", preventAndCallbackHandler(this, "onHover"))
      .on("pointerout", preventAndCallbackHandler(this, "onHoverEnd"))
      .on("pointerdown", preventAndCallbackHandler(this, "onTap"));
  }
}

// function to be used to prevent events from propagating underneath
function preventAndCallbackHandler(context?: any, cbName?: string) {
  // just ignore the pointer, localX and localY
  return (_1: any, _2: any, _3: any, event: Phaser.Types.Input.EventData) => {
    if (context && cbName && typeof context[cbName] === "function") {
      context[cbName].call(context);
    }

    event && event.stopPropagation();
  };
}
