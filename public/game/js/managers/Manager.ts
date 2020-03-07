import { Loader } from "phaser";

type ManagerSubConstructor = typeof Manager;

/**
 *   A manager is a Singleton class that acts as a "facade" for different subsystems of the game
 * abstacting away the complexity of the interconnected objects of those classes
 *
 *  All Managers that implement loading logic by overriding the preload async function and subcribe themselves
 * by CALLING subscribeToLoadingPhase() will have
 * their loading phase run in the loadingScene
 *
 * Manager serves as a base class for the other Managers with: a
 * @method getInstance() static method specific to the "singleton"
 * @method preload() should be overriden in the subclasses -> the loading done by those systems called by the loadingScene
 */
export default class Manager {
  protected static _instance: Manager = null;

  // array of Manager Classes whose preload() funcs will be called in the loadingScene
  private static subscribedManagers: Array<ManagerSubConstructor> = [];

  // the args are provided just so typescript doesn't complain.
  // the parameters passing are meant for the subclasses
  protected constructor(...args: any[]) {}

  // the preload can be asynchronous
  public async preload(load?: Loader.LoaderPlugin) {
    // NO-OP
    return;
  }

  // if any arguments should be passed to the constructor
  public static getInstance(...args: any[]): Manager {
    // the getter will find this._instance on the Manager class
    // but the setter inside will place the _instance property on the subclass
    if (!this._instance) {
      this._instance = new this(...args);
    }

    return this._instance;
  }

  // add a Manager class' preload() in the loading phase
  public static subscribeToLoadingPhase(constrClass: ManagerSubConstructor) {
    Manager.subscribedManagers.push(constrClass);
  }

  public static getSubscribedManagers(): Array<ManagerSubConstructor> {
    return this.subscribedManagers;
  }
}
