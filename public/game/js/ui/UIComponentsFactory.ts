import UIComponent from "./UIComponent";
import IsoScene from "../IsoPlugin/IsoScene";
import UIScene from "../scenes/UIScene";

export default class UIComponents {
  // Instances of all the different components, indexed by their class name
  private static UIInstances = {};

  // Provide the desired UIComponent class and this factory function will return its singleton instance
  public static getUIComponent<
    T extends new (uiScene: UIScene, gameScene: IsoScene) => UIComponent
  >(UIComponentClass: T, uiScene: UIScene, gameScene: IsoScene) {
    if (!this.UIInstances[UIComponentClass.name]) {
      this.UIInstances[UIComponentClass.name] = new UIComponentClass(
        uiScene,
        gameScene
      );
    }

    return this.UIInstances[UIComponentClass.name];
  }
}
