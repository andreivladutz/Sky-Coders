import Manager from "./Manager";
import CST from "../CST";
import MapManager from "./MapManager";
import IsoSpriteObject from "../gameObjects/IsoSpriteObject";
import IsoScene from "../IsoPlugin/IsoScene";
import ActorsManager from "./ActorsManager";
import AstarWorkerManager from "./AstarWorkerManager";

interface Tile {
  x: number;
  y: number;
}

// The common interface expected by the layers manager
// interface TileGameObject {
//   // it needs to have an id
//   objectId: number;
//   // and it needs to have a way to get the grid tiles
//   getGridTiles: () => Tile[];
//   getObjectUID: () => number;
// }

// returned by the LayerManager => a config of a single tile indexed by (x, y) tile coords
interface TileConfig {
  id: number;
  flipX: boolean;
  flipY: boolean;
}

export default class LayersManager extends Manager {
  // the tilemap grid represented efficiently (keeping count of flipX and flipY for each tile)
  tileGrid: Uint8Array[] = [];
  objectLayer: number[][] = [];

  // the same as objectLayer, but populated with each object's uid
  // useful for retreiving an object from grid coords
  private objectUidsGrid: number[][] = [];
  // objects indexed by their UIDs
  private uidsToObjects: { [key: number]: IsoSpriteObject } = {};

  protected constructor(mapGrid: number[][]) {
    super();

    this.initTileGrid(mapGrid);
    this.initObjectLayer(mapGrid[0].length, mapGrid.length);

    MapManager.getInstance().events.on(CST.EVENTS.MAP.MOVE, (tile: Tile) => {
      // console.log(
      //   MapManager.getInstance()
      //     .getIsoBoard()
      //     .board.tileXYToChessArray(tile.x, tile.y)
      // );
      // console.log(this.getTileConfig(tile.x, tile.y).id);
      // console.log(MapManager.getInstance().mapMatrix[tile.y][tile.x]);
    });
  }

  // Get the config of the tile situated at x, y tile coords
  public getTileConfig(x: number, y: number): TileConfig {
    let flipX = getNthBit(this.tileGrid[y][x], CST.LAYERS.MASK.FLIPX_BIT) !== 0,
      flipY = getNthBit(this.tileGrid[y][x], CST.LAYERS.MASK.FLIPY_BIT) !== 0;

    return {
      id: this.tileGrid[y][x] & CST.LAYERS.MASK.TILE_ID_MASK,
      flipX,
      flipY
    };
  }

  /*
   * Notify the astar worker to also apply this layer
   */
  public notifyAstarWorker(layer: Tile[], removeLayer: boolean = false) {
    if (removeLayer) {
      AstarWorkerManager.getInstance().removeLayer(layer);
    } else {
      AstarWorkerManager.getInstance().applyLayer(layer);
    }
  }

  // Apply the object's id on the objectLayer ONLY IF there isn't another object there already
  public applyObjectOnLayer(obj: IsoSpriteObject): this {
    // the id is the id of the object's type
    let id = obj.objectId,
      // the uid is unique to each object
      uid = obj.getObjectUID();

    // actors do not get applied to the grid
    if (id === CST.LAYERS.ACTOR_ID) {
      return;
    }

    let objLayerTiles = obj.getGridTiles();
    for (let tile of objLayerTiles) {
      let { x, y } = tile;

      if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
        continue;
      }

      if (this.objectUidsGrid[y][x] !== CST.ENVIRONMENT.EMPTY_TILE) {
        continue;
      }

      this.objectLayer[y][x] = id;
      this.objectUidsGrid[y][x] = uid;
    }

    // notify astar worker to apply the layer but apply only buildings
    if (id === CST.LAYERS.OBJ_ID.BUILDING) {
      this.notifyAstarWorker(objLayerTiles);
    }
    // for trees, add only the origin tile to the grid
    else if (id === CST.LAYERS.OBJ_ID.TREE) {
      this.notifyAstarWorker([
        {
          x: obj.tileX,
          y: obj.tileY
        }
      ]);
    }

    // also index the object by its uid
    this.uidsToObjects[uid] = obj;

    return this;
  }

  // removes itself from the layer ONLY if its uid is there
  public removeObjectFromLayer(obj: IsoSpriteObject): this {
    if (!this.isObjectAppliedToLayer(obj)) {
      return;
    }

    // the uid is unique to each object
    let uid = obj.getObjectUID();
    let id = obj.objectId;

    let gridTiles = obj.getGridTiles();
    for (let tile of gridTiles) {
      let { x, y } = tile;

      if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
        continue;
      }

      if (this.objectUidsGrid[y][x] !== uid) {
        return this;
      }

      this.objectLayer[y][x] = CST.ENVIRONMENT.EMPTY_TILE;
      this.objectUidsGrid[y][x] = CST.ENVIRONMENT.EMPTY_TILE;
    }

    // notify astar worker to remove the layer but remove only buildings
    if (id === CST.LAYERS.OBJ_ID.BUILDING) {
      this.notifyAstarWorker(gridTiles, true);
    }
    // for trees, remove only the origin tile from the grid
    else if (id === CST.LAYERS.OBJ_ID.TREE) {
      this.notifyAstarWorker(
        [
          {
            x: obj.tileX,
            y: obj.tileY
          }
        ],
        true
      );
    }

    delete this.uidsToObjects[uid];

    return this;
  }

  // returns whether this object has been applied to the object's layer
  public isObjectAppliedToLayer(obj: IsoSpriteObject): boolean {
    // the uid is unique to each object
    let uid = obj.getObjectUID();

    return typeof this.uidsToObjects[uid] !== "undefined";
  }

  /**
   * check collision of this object on the map grid
   * @param object the object to check collision for
   * @param checkAgainstActors @default false if collision should be checked against actors on the map too
   */
  public isColliding(
    object: IsoSpriteObject,
    checkAgainstActors: boolean = false
  ): boolean {
    // tiles ocuppied by this object
    let gridTiles = object.getGridTiles();

    // check if any of the tiles of this object's grid overlaps an empty tile or another object
    for (let tile of gridTiles) {
      // also check if any of the object's grid tile ended up being out of world bounds
      if (
        tile.x < 0 ||
        tile.x >= this.mapWidth ||
        tile.y < 0 ||
        tile.y >= this.mapHeight
      ) {
        return true;
      }

      if (
        this.getTileConfig(tile.x, tile.y).id === CST.ENVIRONMENT.EMPTY_TILE ||
        this.objectLayer[tile.y][tile.x] !== CST.ENVIRONMENT.EMPTY_TILE
      ) {
        return true;
      }

      if (checkAgainstActors === true) {
        // take each grid tile of each actor and check it against each tile of this building
        for (let actor of ActorsManager.getInstance().sceneActors) {
          // In the case we are checking an actor against the other actors
          if (object === actor) {
            continue;
          }

          for (let actorTile of actor.getGridTiles()) {
            if (tile.x === actorTile.x && tile.y === actorTile.y) {
              return true;
            }
          }
        }
      }
    }

    // this tile is safe to walk on
    return false;
  }

  // At first, the object layer is empty
  private initObjectLayer(worldWidth: number, worldHeight: number) {
    for (let y = 0; y < worldHeight; y++) {
      this.objectLayer.push([]);
      this.objectUidsGrid.push([]);

      for (let x = 0; x < worldWidth; x++) {
        this.objectLayer[y][x] = CST.ENVIRONMENT.EMPTY_TILE;
        this.objectUidsGrid[y][x] = CST.ENVIRONMENT.EMPTY_TILE;
      }
    }
  }

  // Represent the map grid efficiently using only 8 bits per tile
  // first two bits represent if the tile should be flipped on the x and y axis
  private initTileGrid(mapGrid: number[][]) {
    for (let i = 0; i < mapGrid.length; i++) {
      let uintTileRow = new Uint8Array(mapGrid[i]);

      for (let i = 0; i < uintTileRow.length; i++) {
        if (uintTileRow[i] === CST.ENVIRONMENT.EMPTY_TILE) {
          continue;
        }

        let flip = Phaser.Math.RND.between(0, 3),
          // should this tile be flipped?
          flipX: boolean,
          flipY: boolean;

        if (flip == 0) {
          flipX = true;
        } else if (flip === 1) {
          flipY = true;
        } else if (flip == 2) {
          flipX = true;
          flipY = true;
        }

        // if the tiles should be flipped, set the corresponding bits
        if (flipX) {
          uintTileRow[i] = setNthBit(uintTileRow[i], CST.LAYERS.MASK.FLIPX_BIT);
        }

        if (flipY) {
          uintTileRow[i] = setNthBit(uintTileRow[i], CST.LAYERS.MASK.FLIPY_BIT);
        }
      }

      // after processing each row, save it for later querrying
      this.tileGrid[i] = uintTileRow;
    }
  }

  private get mapWidth() {
    return this.tileGrid[0].length;
  }

  private get mapHeight() {
    return this.tileGrid.length;
  }

  public debugLayers(scene: IsoScene) {
    let debugGraphics = scene.add.graphics().setDepth(CST.LAYER_DEPTH.UI),
      emptyTiles = [],
      populatedTiles = [];

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        if (this.objectLayer[y][x] === CST.ENVIRONMENT.EMPTY_TILE) {
          emptyTiles.push({ x, y });
        } else {
          populatedTiles.push({ x, y });
        }
      }
    }

    MapManager.getInstance()
      .getIsoBoard()
      .drawTilesOnGrid(
        emptyTiles,
        CST.COLORS.GREEN,
        CST.GRID.LINE_WIDTH,
        0,
        CST.COLORS.GREEN,
        debugGraphics
      );

    populatedTiles.forEach(tile => {
      MapManager.getInstance()
        .getIsoBoard()
        .drawTilesOnGrid(
          [tile],
          CST.COLORS.RED,
          CST.GRID.LINE_WIDTH,
          CST.GRID.FILL_ALPHA,
          CST.COLORS.RED,
          debugGraphics
        );
    });
  }

  // TODO: the order of getInstance() IN THE APPLICATION is important
  public static getInstance(mapGrid?: number[][]) {
    if (!this._instance && !mapGrid) {
      throw new Error(
        "The first call to LayersManager.getInstance should be provided the mapGrid"
      );
    }

    return super.getInstance(mapGrid) as LayersManager;
  }
}

function getNthBit(value: number, n: number) {
  return value & (1 << n);
}

function setNthBit(value: number, n: number) {
  return value | (1 << n);
}
