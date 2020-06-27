import { Game } from "../../../common/MessageTypes";
import Messenger from "./Messenger";

export default class ResourcesMessenger extends Messenger {
  private _initialResources: Game.Resources;

  public set initialResources(value: Game.Resources) {
    this._initialResources = value;
  }

  public get initialResources() {
    let resources = this._initialResources;
    this._initialResources = null;

    return resources;
  }

  protected registerEventListening() {}
}
