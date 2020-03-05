import { Loader } from "phaser";

/**
 *   A manager is a Singleton class that acts as a "facade" for different subsystems of the game
 * abstacting away the complexity of the interconnected objects of those classes
 *
 * Manager serves as a base class for the other Managers with: a
 * @method getInstance() static method specific to the "singleton"
 * @method preload() should be overriden in the subclasses -> the loading done by those systems called by the loadingScene
 */
export default class Manager {
  protected static _instance: Manager = null;

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
}
