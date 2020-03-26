import UIComponent from "./UIComponent";
import IsoScene from "../IsoPlugin/IsoScene";

export default class UIComponents {
  // Instances of all the different components, indexed by their class name
  private static UIInstances = {};

  // Provide the desired UIComponent class and this factory function will return its singleton instance
  public static getUIComponent<T extends new (IsoScene) => UIComponent>(
    UIComponentClass: T,
    scene: IsoScene
  ) {
    if (!this.UIInstances[UIComponentClass.name]) {
      this.UIInstances[UIComponentClass.name] = new UIComponentClass(scene);
    }

    return this.UIInstances[UIComponentClass.name];
  }
}
