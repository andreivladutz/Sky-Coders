import IsoSpriteObject from "./IsoSpriteObject";
import MapManager from "../managers/MapManager";
import CST from "../CST";

import MoveTo from "../plugins/MoveToPlugin/MoveTo";
import AstarWorkerManager from "../managers/AstarWorkerManager";
import EnvironmentManager from "../managers/EnvironmentManager";

interface TileXY {
  x: number;
  y: number;
}

interface NavSpriteConfig {
  actorKey: string;
  scene: Phaser.Scene;
  tileX: number;
  tileY: number;
  z?: number;
  objectId: number;
  texture: string;
  frame?: string | number;
  // tileZ is needed to prevent bugs due to kick events on the rexBoard
  tileZ: number;
}

// A navigating subclass of the sprite object
export default class NavSpriteObject extends IsoSpriteObject {
  // Remember the tileZ position
  tileZ: number;
  pathFollowing: TileXY[];
  // MoveTo plugin instance used for moving this sprite
  moveTo: MoveTo;

  // the size of the map in tiles
  mapWidth: number = 0;
  mapHeight: number = 0;

  actorKey: string;

  // this astar worker manager
  astarWorkerManager: AstarWorkerManager;

  constructor(config: NavSpriteConfig) {
    // This type of object doesn't get applied to the layer as it travels all the time
    super({
      ...config,
      shouldBeAppliedToLayer: false
    });

    this.tileZ = config.tileZ;
    this.actorKey = config.actorKey;

    // RexPlugins behaviour:
    this.moveTo = new MoveTo(this, {
      // Keep the speed consistent against multiple screen sizes
      speed:
        CST.NAV_OBJECT.SPEED *
        (EnvironmentManager.getInstance().TILE_WIDTH /
          CST.NAV_OBJECT.IDEAL_TILESIZE),
      rotateToTarget: false,
      //occupiedTest: false,
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

  // find a path from this actor's current position to the (tileX, tileY) position
  public async findPathTo(tileX: number, tileY: number): Promise<TileXY[]> {
    if (tileX !== Math.floor(tileX) || tileY !== Math.floor(tileY)) {
      return null;
    }

    return await this.astarWorkerManager.findPath(
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
  }

  // If the path to (tileX, tileY) is not null then it means it is reachable
  public async isCoordReachable(
    tileX: number,
    tileY: number
  ): Promise<boolean> {
    if (tileX < 0 || tileX >= this.mapManager.mapWidth) {
      return false;
    }

    if (tileX < 0 || tileY >= this.mapManager.mapHeight) {
      return false;
    }

    return (await this.findPathTo(tileX, tileY)) !== null;
  }

  // find path to tileX and tileY and start moving towards there
  public async navigateTo(tileX: number, tileY: number) {
    this.pathFollowing = await this.findPathTo(tileX, tileY);
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

    // Angle between current tile and next tile
    let angle =
      (Phaser.Math.Angle.BetweenPoints({ x, y }, this.tileCoords) * 180) /
      Math.PI;

    // Diagonals first
    if (angle === 45) {
      this.emit(WALK_EV.NW);
    } else if (angle === 135) {
      this.emit(WALK_EV.NE);
    } else if (angle === -135) {
      this.emit(WALK_EV.SE);
    } else if (angle === -45) {
      this.emit(WALK_EV.SW);
    }
    // Walk left
    else if (Math.abs(angle) < 45) {
      this.emit(WALK_EV.W);
    }
    // Walk right
    else if (Math.abs(angle) > 135) {
      this.emit(WALK_EV.E);
    }
    // Walk up
    else if (angle > 45 && angle < 135) {
      this.emit(WALK_EV.N);
    }
    // Walk downwards
    else if (angle > -135 && angle < -45) {
      this.emit(WALK_EV.S);
    }

    this.moveTo.moveTo(x, y);
  }
}
