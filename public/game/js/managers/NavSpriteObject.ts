import IsoSpriteObject from "./IsoSpriteObject";
import MapManager from "./MapManager";
import CST from "../CST";

import MoveTo from "../MoveToPlugin/MoveTo";
import EasyStar from "../utils/astar/easystar";

interface TileXY {
  x: number;
  y: number;
}

// A navigating subclass of the sprite object
export default class NavSpriteObject extends IsoSpriteObject {
  pathFollowing: TileXY[];
  // MoveTo plugin instance used for moving this sprite
  moveTo: MoveTo;

  // the size of the map in tiles
  mapWidth: number = 0;
  mapHeight: number = 0;

  constructor(
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    z: number,
    texture: string,
    frame?: string | number
  ) {
    super(scene, tileX, tileY, z, texture, frame);

    // RexPlugins behaviour:
    this.moveTo = new MoveTo(this, {
      speed: CST.NAV_OBJECT.SPEED,
      rotateToTarget: false,
      //occupiedTest: true
      blockerTest: false
    });

    let mapMgrInstance = MapManager.getInstance();

    // the size of the map in tiles, useful for walkable checking
    ({ w: this.mapWidth, h: this.mapHeight } = mapMgrInstance.getMapTilesize());
  }

  // this function will be called to compute whether a tile should be walked on or not
  private walkableCallback(currTile: TileXY): boolean {
    console.log("CAlled cost function");

    // tiles ocuppied by this object
    let gridTiles = this.getGridTiles(currTile.x, currTile.y);

    // check if any of the tiles of this object's grid overlaps a blocker. if so it's a no-no!
    for (let tile of gridTiles) {
      // also check if any of the object's grid tile ended up being out of world bounds
      if (
        tile.x < 0 ||
        tile.x >= this.mapWidth ||
        tile.y < 0 ||
        tile.y >= this.mapHeight
      ) {
        return false;
      }

      if (this.mapManager.getIsoBoard().board.hasBlocker(tile.x, tile.y)) {
        return false;
      }
    }

    // this tile is safe to walk on
    return true;
  }

  // smoothen the path walked by this game object
  // do not want to walk in zig zags if succesive tiles are on a diagonal
  private smoothPath(): TileXY[] {
    let i = 0,
      n = this.pathFollowing.length,
      path = this.pathFollowing,
      smoothedPath = [];
    const abs = Math.abs;

    const getDx = (a: TileXY, b: TileXY) => a.x - b.x,
      getDy = (a: TileXY, b: TileXY) => a.y - b.y;

    while (i < n) {
      smoothedPath.push(path[i]);

      // if there is a next tile in the path check if it's diagonal to this tile
      if (path[i + 1]) {
        let dx = getDx(path[i + 1], path[i]),
          dy = getDy(path[i + 1], path[i]);

        // diagonal found
        if (abs(dx) === 1 && abs(dy) === 1) {
          // we can skip the tile in-between i.e. tile at i + 1
          do {
            i = i + 1;
          } while (
            path[i + 1] &&
            getDx(path[i + 1], path[i]) === dx &&
            getDy(path[i + 1], path[i]) === dy
          );

          smoothedPath.push(path[i]);
        }
      }

      i = i + 1;
    }

    return smoothedPath;
  }

  // find path to tileX and tileY and start moving towards there
  navigateTo(tileX: number, tileY: number) {
    let easystar = new EasyStar.js();

    easystar
      .setGrid(this.mapManager.mapMatrix)
      .setUnacceptableTiles([0])
      .enableDiagonals()
      .setIterationsPerCalculation(100)
      .setCanWalkOnCb(this.walkableCallback, this);

    easystar.findPath(
      this.tileX,
      this.tileY,
      tileX,
      tileY,
      (path: TileXY[]) => {
        this.pathFollowing = path;

        console.log(this.pathFollowing);

        // no path has been found
        if (path === null) {
          return;
        }

        this.pathFollowing = this.smoothPath();

        // start moving along path
        this.moveAlongPath();
      }
    );

    easystar.calculate();
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
