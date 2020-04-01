import UIComponent from "./UIComponent";
import IsoScene from "../IsoPlugin/IsoScene";
import UIScene from "../scenes/UIScene";

import Manager from "../managers/Manager";
import { Loader } from "phaser";
import CST from "../CST";
import LoaderInjector, {
  LoadingInjectedManager,
  FramesMap
} from "../managers/LoaderInjector";

import UIStateMachine from "./UIStateMachine";

type UIComponentConstructor = new (
  uiScene: UIScene,
  gameScene: IsoScene
) => UIComponent;

type UIComponentsMap = {
  [K: string]: UIComponent;
};

export default class UIComponents extends Manager
  implements LoadingInjectedManager {
  // Instances of all the different components, indexed by their class name
  private static UIInstances: UIComponentsMap = {};

  public static uiStateMachine: UIStateMachine;

  /**
   * Provide the desired UIComponent(s) class(es) and this factory function will return its(their) singleton instance
   * @param UIComponentClass  A single constructor or an array of constructors
   * @param uiScene the ui scene
   * @param gameScene the game scene
   */
  public static getUIComponents<T extends UIComponentConstructor>(
    UIComponentClass: T | T[],
    uiScene: UIScene,
    gameScene: IsoScene
  ): UIComponent[] {
    let UIComponentClasses: T[],
      uiInstances: UIComponent[] = [];

    // whether a single class, or an array of classes is passed along
    // transform it in an array of classes to be processed
    if (!(UIComponentClass instanceof Array)) {
      UIComponentClasses = [UIComponentClass];
    } else {
      UIComponentClasses = UIComponentClass;
    }

    for (let ComponentClass of UIComponentClasses) {
      if (!this.UIInstances[ComponentClass.name]) {
        this.UIInstances[ComponentClass.name] = new ComponentClass(
          uiScene,
          gameScene
        );
      }

      uiInstances.push(this.UIInstances[ComponentClass.name]);
    }

    return uiInstances;
  }

  // init the global ui state machine
  public static initUIStateMachine(
    uiScene: UIScene,
    gameScene: IsoScene
  ): UIStateMachine {
    this.uiStateMachine = new UIStateMachine(uiScene, gameScene);

    return this.uiStateMachine;
  }

  public static getUIStateMachine(): UIStateMachine {
    return this.uiStateMachine;
  }

  // the frames of the buttons indexed by their identifier i.e. "Settings", etcetera..
  buttonsFrames: FramesMap = {};

  // Will be injected by the LoaderInjector class
  loadResources: (load: Phaser.Loader.LoaderPlugin) => void;
  getTextureKey: () => string;

  public async preload(load: Loader.LoaderPlugin) {
    LoaderInjector.Inject(this, this.buttonsFrames, CST.BUTTONS)(load);
  }

  public static getInstance(): UIComponents {
    return super.getInstance() as UIComponents;
  }
}

Manager.subscribeToLoadingPhase(UIComponents);
