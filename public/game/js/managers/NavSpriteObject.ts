import IsoSpriteObject from "./IsoSpriteObject";
import CST from "../CST";

import MoveTo from "../MoveToPlugin/MoveTo";
import { PathFinder } from "phaser3-rex-plugins/plugins/board-components.js";

interface TileXY {
  x: number;
  y: number;
}

// A tile returned by the path finder plugin
interface PathTile extends TileXY {
  cost: number;
}

// A navigating subclass of the sprite object
export default class NavSpriteObject extends IsoSpriteObject {
  pathFollowing: PathTile[];
  // MoveTo plugin instance used for moving this sprite
  moveTo: MoveTo;
  // PathFinder plugin used to find path
  pathFinder: PathFinder;

  constructor(
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    z: number,
    texture: string,
    frame?: string | number
  ) {
    super(scene, tileX, tileY, z, texture, frame);

    // RexPlugins behaviours:
    this.moveTo = new MoveTo(this, {
      speed: CST.NAV_OBJECT.SPEED,
      rotateToTarget: false,
      //occupiedTest: true
      blockerTest: false
    });

    this.pathFinder = new PathFinder(this, {
      occupiedTest: true,
      blockerTest: true,
      costCallback: this.costCallback,
      costCallbackScope: this,
      // useful when using a cost function
      cacheCost: false,
      // use A* algorithm
      pathMode: "A*-line",
      // Weight parameter for A* searching mode
      weight: 10
    });
  }

  // this function will be called to compute cost when deciding path
  // "currTileXY, preTileXY : TileXY position {x, y}. Cost of moving from preTileXY to currTileXY"
  private costCallback(
    currTile: TileXY,
    preTile: TileXY,
    pathFinder: PathFinder
  ) {
    // return this when we cannot move to currTile
    const BLOCKER = pathFinder.BLOCKER,
      CONSTANT_COST = 1;

    // tiles ocuppied by this object
    let gridTiles = this.getGridTiles(currTile.x, currTile.y);

    // check if any of the tiles of this object's grid overlaps a blocker. if so it's a no-no!
    for (let tile of gridTiles) {
      if (this.mapManager.getIsoBoard().board.hasBlocker(tile.x, tile.y)) {
        return BLOCKER;
      }
    }

    return CONSTANT_COST;
  }

  // find path to tileX and tileY and start moving towards there
  navigateTo(tileX: number, tileY: number) {
    this.pathFollowing = this.pathFinder.findPath({ x: tileX, y: tileY });

    // start moving along path
    this.moveAlongPath();
  }

  // Method that recursively calls itself while this actor is moving, until the movement is over
  private moveAlongPath() {
    // The object reached it's destination
    if (this.pathFollowing.length === 0) {
      return;
    }

    this.moveTo.once(
      "complete",
      () => {
        this.moveAlongPath();
      },
      this
    );

    // next tile in the path to move to
    let { x, y } = this.pathFollowing.shift();

    this.moveTo.moveTo(x, y);
  }
}
