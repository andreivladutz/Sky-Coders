import IsoScene from "../IsoPlugin/IsoScene";
import UIScene from "../scenes/UIScene";

export default class UIComponent {
  // Keep track of the UIScene, as well as the gameScene
  uiScene: UIScene;
  gameScene: IsoScene;

  constructor(uiScene: UIScene, gameScene: IsoScene) {
    this.uiScene = uiScene;
    this.gameScene = gameScene;
  }
}
