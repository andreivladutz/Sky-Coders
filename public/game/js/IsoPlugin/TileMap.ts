import { IsoSprite, IsoScene, Point3 } from "../IsoPlugin/IsoPlugin";
import IsoBoard, { TileXY } from "./IsoBoard";
import IsoTile from "./IsoTile";

import List, { Node } from "../utils/List";
import CST from "../CST";
import EnvironmentManager from "../managers/EnvironmentManager";
import LayersManager from "../managers/LayersManager";

interface DynamicIsoSprite extends IsoSprite {
  [key: string]: any;
}

interface TileMapConfig {
  scene: IsoScene;
  // real size of a tile texture
  tileWidth: number;
  tileHeight: number;
  // map size in tiles
  mapWidth: number;
  mapHeight: number;
  mapMatrix: number[][];
}

export default class TileMap {
  // the game scene this
  scene: IsoScene;
  // the underlying board provided by the Board Plugin
  isoBoard: IsoBoard;

  // Tilesize of the map
  mapWidth: number;
  mapHeight: number;

  // real size of a tile texture
  tileWidth: number;
  tileHeight: number;

  // the map data of tile indices
  mapMatrix: number[][];
  // for each (y, x) tilesInPlace[y][x] represents if the tile at (x, y) coords
  // is already in place, otherwise a tile should be instanced and placed at those coords
  tilesInPlace: boolean[][] = [];

  // A sparse matrix kept to recognize tiles that are cliffs (i.e. they are margins of the world)
  // if a tile is a cliff, then this matrix will keep it's IsoTile
  cliffsSparseMatrix: { [key: number]: { [key: number]: IsoTile } } = {};

  // tile pools
  unusedPool: List;
  usedPool: List;

  envManager: EnvironmentManager;

  // always remember the last tinted tile so we can clear its tint when we leave the tile
  lastTintedTile: IsoTile;

  constructor(config: TileMapConfig) {
    this.scene = config.scene;

    // the used projector
    let projector = this.scene.iso.projector;

    // determine the position of the map corner
    let { x: mapX, y: mapY } = projector.project(new Point3(0, 0, 0));

    this.tileWidth = config.tileWidth;
    this.tileHeight = config.tileHeight;
    this.mapWidth = config.mapWidth;
    this.mapHeight = config.mapHeight;

    this.isoBoard = IsoBoard.getInstance({
      scene: this.scene,
      x: mapX,
      y: mapY,
      tileWidth: config.tileWidth,
      tileHeight: config.tileHeight,
      mapWidth: config.mapWidth,
      mapHeight: config.mapHeight,
      mapMatrix: config.mapMatrix
    }).showGrid();

    // the map data with tile indices
    this.mapMatrix = config.mapMatrix;

    this.envManager = EnvironmentManager.getInstance();

    // init the pools of used and unused tiles
    this.usedPool = new List();
    this.unusedPool = new List();

    // no tile is in place at first
    this.initTilesInPlace();

    // add event listeners
    this.registerToEvents();

    // generate the frames for the cliffs (the margins of the world)
    this.generateCliffs();
  }

  public onUpdate() {
    // check every update cycle if the viewport moved
    // if so, redraw all tiles
    if (this.isoBoard.viewRectangleDirty) {
      this.redrawTiles();
    }
  }

  public onTileOver(tileXY: TileXY) {
    let x = tileXY.x,
      y = tileXY.y;

    // don't forget to clear the last tile on tile exit
    this.clearTintedTile(x, y);

    // we are over a valid tile, different than the last tinted one
    if (
      this.mapMatrix[y][x] &&
      (!this.lastTintedTile ||
        this.lastTintedTile.tileX !== x ||
        this.lastTintedTile.tileY !== y)
    ) {
      this.lastTintedTile = new IsoTile(
        this.scene,
        x * this.tileHeight,
        y * this.tileHeight,
        x,
        y,
        this.envManager.getTextureKey()
      )
        .setOrigin(0.5, 0.5)
        .setTint(0x86bfda)
        .setDepth(CST.LAYER_DEPTH.TILES);

      // Add the frame and flip the tile accordingly
      this.preprocessTile(x, y, this.lastTintedTile);
    }
  }

  public clearTintedTile(x?: number, y?: number) {
    // if no (x, y) coords provided just clear the tile
    if (typeof x === "undefined") {
      if (this.lastTintedTile) {
        this.lastTintedTile.destroy();
        this.lastTintedTile = null;

        return;
      }
    }

    if (
      this.lastTintedTile &&
      (this.lastTintedTile.tileX !== x || this.lastTintedTile.tileY !== y)
    ) {
      this.lastTintedTile.destroy();
      this.lastTintedTile = null;
    }
  }

  // this method checks if there is any unused tile in the pool of unused tile
  // otherwise allocates a new one
  // and returns a tile at (x, y) TILE coords
  getUnusedTile(x: number, y: number): IsoTile {
    // get this last tile from the unused pool
    let tile: IsoTile = this.unusedPool.pop(),
      texture = this.envManager.getTextureKey();

    // if no tile is found, create a new one
    if (!tile) {
      tile = new IsoTile(
        this.scene,
        x * this.tileHeight,
        y * this.tileHeight,
        x,
        y,
        texture
      ).setDepth(CST.LAYER_DEPTH.TILES);
    }
    // an unused tile already exists, reuse this one
    else {
      tile
        .set3DPosition(x * this.tileHeight, y * this.tileHeight, 0)
        .setTilePosition(x, y)
        .setVisible(true);
    }

    return this.preprocessTile(x, y, tile);
  }

  // set the correct frame to the tile and flip it if it's flipped in the game world
  private preprocessTile(x: number, y: number, tile: IsoTile): IsoTile {
    let tileCfg = LayersManager.getInstance().getTileConfig(x, y);

    // what should be the frame of this tile
    let frame = this.envManager.getGrassFrame(tileCfg.id);

    return tile.setFrame(frame).setFlip(tileCfg.flipX, tileCfg.flipY);
  }

  registerToEvents() {
    // when the game resizes, we should reposition all the tiles
    this.scene.scale.on(
      "resize",
      () => {
        this.initTilesInPlace();

        let usedTile: Node;
        while ((usedTile = this.usedPool.pop())) {
          this.unusedPool.push(usedTile);
        }

        for (let y in this.cliffsSparseMatrix) {
          for (let x in this.cliffsSparseMatrix[y]) {
            this.cliffsSparseMatrix[y][x].reset3DPosition();
          }
        }
      },
      this
    );
  }

  /**
   * Redraw tiles using existing ones, or
   * when there aren't enough tiles in the tileLayerGroup pool of tiles
   * add new ones
   */
  redrawTiles(): this {
    // only redraw the visible tiles
    let visibleTiles = this.isoBoard.getTilesInView();

    // check each tile in the usedPool if it is still visible
    this.usedPool.each((tileNode: Node) => {
      let tile = tileNode.value;

      // this tile isn't in view anymore
      if (!tile.inView(this.isoBoard)) {
        // push the tile in the unused pool
        this.usedPool.remove(tileNode);
        this.unusedPool.push(tile);

        tile.setVisible(false);

        let y = tile.tileY,
          x = tile.tileX;

        this.tilesInPlace[y][x] = false;

        if (this.cliffsSparseMatrix[y] && this.cliffsSparseMatrix[y][x]) {
          this.cliffsSparseMatrix[y][x].setVisible(false);
        }
      }
    });

    visibleTiles.forEach(({ x, y }) => {
      // there is no tile to be drawn
      if (
        !this.mapMatrix[y] ||
        this.mapMatrix[y][x] === CST.ENVIRONMENT.EMPTY_TILE
      ) {
        return;
      }
      // also if this tile is already in place, don't reposition it
      if (this.tilesInPlace[y][x]) {
        return;
      }

      // if a cliff should be drawn underneath this tile
      if (this.cliffsSparseMatrix[y] && this.cliffsSparseMatrix[y][x]) {
        this.cliffsSparseMatrix[y][x].setVisible(true);
      }
      //   let cliffTile = this.getUnusedTile(x, y, this.cliffsSparseMatrix[y][x]);

      //   cliffTile.setDepth(-1);

      //   this.usedPool.push(cliffTile);
      // }

      // get an unused tile at x, y tile coords
      let tile = this.getUnusedTile(x, y);

      // push this tile in the pool of used tiles and mark it as being in place
      this.usedPool.push(tile);
      this.tilesInPlace[y][x] = true;
    });

    // redrew tiles, this viewRectangle is not dirty anymore
    this.isoBoard.viewRectangleDirty = false;
    return this;
  }

  private generateCliffs() {
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        if (this.mapMatrix[y][x] !== CST.ENVIRONMENT.EMPTY_TILE) {
          if (
            isMargin(x, y, this.mapMatrix) ||
            x === this.mapWidth - 1 ||
            y === this.mapHeight - 1
          ) {
            if (!this.cliffsSparseMatrix[y]) {
              this.cliffsSparseMatrix[y] = {};
            }

            // this.cliffsSparseMatrix[y][x] = Phaser.Math.RND.pick(
            //   this.envManager.cliffFrames
            // );

            this.cliffsSparseMatrix[y][x] = new IsoTile(
              this.scene,
              x * this.tileHeight,
              y * this.tileHeight,
              x,
              y,
              this.envManager.getTextureKey(),
              Phaser.Math.RND.pick(this.envManager.cliffFrames)
            )
              .setDepth(CST.LAYER_DEPTH.CLIFFS)
              .setVisible(false);
          }
        }
      }
    }
  }

  // no tile is in place at first, so init a matrix of false values
  private initTilesInPlace() {
    for (let i = 0; i < this.mapMatrix.length; i++) {
      // init this row if it is undefined
      this.tilesInPlace[i] || (this.tilesInPlace[i] = []);

      for (let j = 0; j < this.mapMatrix[i].length; j++) {
        this.tilesInPlace[i][j] = false;
      }
    }
  }
}

function* getNeighbours(x: number, y: number): Generator<TileXY> {
  let directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1]
  ];

  for (let direction of directions) {
    yield { x: x + direction[1], y: y + direction[0] };
  }
}

// check if margin tile
function isMargin(x: number, y: number, mapGrid: number[][]) {
  for (let tile of getNeighbours(x, y)) {
    if (
      mapGrid[tile.y] &&
      mapGrid[tile.y][tile.x] === CST.ENVIRONMENT.EMPTY_TILE
    ) {
      return true;
    }
  }

  return false;
}
