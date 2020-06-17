import IsoScene from "../../IsoPlugin/IsoScene";
import UIScene from "../../scenes/UIScene";

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
