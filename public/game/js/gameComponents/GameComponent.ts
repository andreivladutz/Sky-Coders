/* The base class for the game objects' components */
import IsoSpriteObject from "../gameObjects/IsoSpriteObject";
import EventEmitter = Phaser.Events.EventEmitter;

export default class GameComponent extends EventEmitter {
  public parentObject: IsoSpriteObject;

  public constructor(parent: IsoSpriteObject) {
    super();

    this.parentObject = parent;
  }
}
