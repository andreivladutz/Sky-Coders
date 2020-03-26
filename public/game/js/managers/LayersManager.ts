import Manager from "./Manager";
import CST from "../CST";
import MapManager from "./MapManager";
import IsoSpriteObject from "../gameObjects/IsoSpriteObject";

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
      console.log(
        MapManager.getInstance()
          .getIsoBoard()
          .board.tileXYToChessArray(tile.x, tile.y)
      );
    });

    setTimeout(() => {
      console.log(this.objectUidsGrid, this.objectLayer, this.uidsToObjects);
    }, 10000);
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

  // Apply the object's id on the objectLayer
  public applyObjectOnLayer(obj: IsoSpriteObject): this {
    // the id is the id of the object's type
    let id = obj.objectId,
      // the uid is unique to each object
      uid = obj.getObjectUID();

    // actors do not get applied to the grid
    if (id === CST.LAYERS.ACTOR_ID) {
      return;
    }

    for (let tile of obj.getGridTiles()) {
      let { x, y } = tile;

      if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
        continue;
      }

      this.objectLayer[y][x] = id;
      this.objectUidsGrid[y][x] = uid;
    }

    // also index the object by it's uid
    this.uidsToObjects[uid] = obj;

    return this;
  }

  // check collision of this object on the map grid
  public checkCollision(object: IsoSpriteObject): boolean {
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
        return false;
      }

      if (
        this.getTileConfig(tile.x, tile.y).id === CST.ENVIRONMENT.EMPTY_TILE ||
        this.objectLayer[tile.y][tile.x] !== CST.ENVIRONMENT.EMPTY_TILE
      ) {
        return false;
      }
    }

    // this tile is safe to walk on
    return true;
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
