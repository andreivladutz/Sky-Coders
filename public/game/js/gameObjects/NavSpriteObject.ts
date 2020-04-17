import IsoSpriteObject from "./IsoSpriteObject";
import MapManager from "../managers/MapManager";
import CST from "../CST";

import MoveTo from "../plugins/MoveToPlugin/MoveTo";
import AstarWorkerManager from "../managers/AstarWorkerManager";

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
    objectId: number,
    texture: string,
    frame?: string | number
  ) {
    // This type of object doesn't get applied to the layer as it travels all the time
    super(scene, tileX, tileY, z, objectId, texture, frame, false);

    this.actorKey = actorKey;

    // RexPlugins behaviour:
    this.moveTo = new MoveTo(this, {
      speed: CST.NAV_OBJECT.SPEED,
      rotateToTarget: false,
      //occupiedTest: true
      blockerTest: false
    });

    // the size of the map in tiles, useful for walkable checking
    ({
      w: this.mapWidth,
      h: this.mapHeight
    } = this.mapManager.getMapTilesize());

    this.astarWorkerManager = AstarWorkerManager.getInstance();

    // if this worker hasn't been initialised yet by other actors of the same type, initialise it
    if (!this.astarWorkerManager.isWorkerActorInited(this.actorKey)) {
      this.astarWorkerManager.initWorkerWithActor(this.actorKey, {
        localTileX: this.localTileX,
        localTileY: this.localTileY,
        tileWidthX: this.tileWidthX,
        tileWidthY: this.tileWidthY
      });
    }
  }

  // a way to cancel this object's movement
  public cancelMovement() {
    this.pathFollowing = null;
  }

  // find path to tileX and tileY and start moving towards there
  async navigateTo(tileX: number, tileY: number) {
    let pathFollowing = await this.astarWorkerManager.findPath(
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

    this.pathFollowing = pathFollowing;

    this.moveAlongPath();
  }

  // Method that recursively calls itself while this actor is moving, until the movement is over
  private moveAlongPath() {
    // The object reached it's destination
    if (!this.pathFollowing || this.pathFollowing.length === 0) {
      if (!this.moveTo.isRunning) {
        this.emit(CST.NAV_OBJECT.EVENTS.IDLE);
      }
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

    const WALK_EV = CST.NAV_OBJECT.EVENTS.WALKING;

    let dx = Math.floor(x - this.tileCoords.x),
      dy = Math.floor(y - this.tileCoords.y);

    if (dx > 0) {
      if (dy > 0) {
        this.emit(WALK_EV.SE);
      } else if (dy < 0) {
        this.emit(WALK_EV.NE);
      } else {
        this.emit(WALK_EV.E);
      }
    } else if (dx < 0) {
      if (dy < 0) {
        this.emit(WALK_EV.NW);
      } else if (dy > 0) {
        this.emit(WALK_EV.SW);
      } else {
        this.emit(WALK_EV.W);
      }
    } else {
      if (dy < 0) {
        this.emit(WALK_EV.N);
      } else if (dy > 0) {
        this.emit(WALK_EV.S);
      }
    }

    this.moveTo.moveTo(x, y);
  }
}
