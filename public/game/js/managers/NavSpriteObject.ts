import IsoSpriteObject from "./IsoSpriteObject";
import MapManager from "./MapManager";
import CST from "../CST";

import MoveTo from "../MoveToPlugin/MoveTo";
import AstarWorkerManager from "./AstarWorkerManager";

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

  actorKey: string;

  // this astar worker manager
  astarWorkerManager: AstarWorkerManager;

  constructor(
    actorKey: string,
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    z: number,
    texture: string,
    frame?: string | number
  ) {
    super(scene, tileX, tileY, z, texture, frame);

    this.actorKey = actorKey;

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

    this.astarWorkerManager = AstarWorkerManager.getInstance();

    // if this worker hasn't been initialised yet by other actors, initialise it
    if (!this.astarWorkerManager.getWorker(this.actorKey)) {
      this.astarWorkerManager.initWorker(this.actorKey, {
        localTileX: this.localTileX,
        localTileY: this.localTileY,
        tileWidthX: this.tileWidthX,
        tileWidthY: this.tileWidthY,
        mapWidth: this.mapWidth,
        mapHeight: this.mapHeight,
        // TODO: In the future there should be some layered approach
        mapGrid: mapMgrInstance.mapMatrix,
        unwalkableTile: CST.ENVIRONMENT.EMPTY_TILE
      });
    }
  }

  // find path to tileX and tileY and start moving towards there
  async navigateTo(tileX: number, tileY: number) {
    this.pathFollowing = await this.astarWorkerManager.findPath(
      this.actorKey,
      {
        x: this.tileX,
        y: this.tileY
      },
      {
        x: tileX,
        y: tileY
      }
    );

    this.moveAlongPath();
  }

  // Method that recursively calls itself while this actor is moving, until the movement is over
  private moveAlongPath() {
    // The object reached it's destination
    if (!this.pathFollowing || this.pathFollowing.length === 0) {
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

    //this.moveTo.setSpeed(CST.NAV_OBJECT.SPEED);

    this.moveTo.moveTo(x, y);
  }
}
