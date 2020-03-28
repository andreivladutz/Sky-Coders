import Phaser from "phaser";
import IsoSpriteObject from "../gameObjects/IsoSpriteObject";
import CST from "../CST";

const EventEmitter = Phaser.Events.EventEmitter;

interface Tile {
  x: number;
  y: number;
}

/**
 * class specialised for the MapManager and the underlying IsoBoard
 * it helps preventing the default behaviour from the isoboard (tilemove, tiletap)
 * when these events are first emitting on an IsoSpriteObject that's between the board and the cursor
 */
export default class MapEventEmitter extends EventEmitter {
  objSpritePreventing: IsoSpriteObject = null;

  // registers the sprite that should be preventing the event
  public registerDefaultPrevention(obj: IsoSpriteObject) {
    this.objSpritePreventing = obj;

    // emit that we started preventing tilemoves and such
    this.emit(CST.EVENTS.MAP.PREVENTING);
  }

  public unregisterDefaultPrevention() {
    this.objSpritePreventing = null;
  }

  // prevent the default only if the tile is on the grid of the preventing object
  public shouldPreventDefault({ x, y }: Tile): boolean {
    if (!this.objSpritePreventing) {
      return false;
    }

    return this.objSpritePreventing.tileCoordsOnThisGrid(x, y);
  }
}
