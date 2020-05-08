import { IsoScene, Point3 } from "../IsoPlugin/IsoPlugin";
import IsoBoard, { TileXY, ViewExtremes } from "./IsoBoard";
import IsoTile from "./IsoTile";

import List from "../utils/dataTypes/List";
import CST from "../CST";
import EnvironmentManager from "../managers/EnvironmentManager";
import LayersManager from "../managers/LayersManager";

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
  tilesInPlace: IsoTile[][] = [];

  // A sparse matrix kept to recognize tiles that are cliffs (i.e. they are margins of the world)
  // if a tile is a cliff, then this matrix will keep it's IsoTile
  cliffsSparseMatrix: { [key: number]: { [key: number]: IsoTile } } = {};

  // tile pools
  unusedPool: List<IsoTile>;
  // usedPool: List<IsoTile>;

  // Keep the old view rect so we can free unused tiles into the pool
  oldView: ViewExtremes;

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
    });

    // the map data with tile indices
    this.mapMatrix = config.mapMatrix;

    this.envManager = EnvironmentManager.getInstance();

    // init the pools of used and unused tiles
    // this.usedPool = new List();
    this.unusedPool = new List();

    // no tile is in place at first
    this.initTilesInPlace();

    // add event listeners
    this.registerToEvents();

    // generate the frames for the cliffs (the margins of the world)
    this.generateCliffs();

    // window.onkeydown = () => {
    //   let extremes = this.isoBoard.getExtremesTileCoords(true);

    //   let topY = extremes.topmostY,
    //     lowY = extremes.lowermostY,
    //     rightX = extremes.rightmostX,
    //     leftX = extremes.leftmostX,
    //     midX = Math.floor((rightX + leftX) / 2);

    //   // The maximum distance from the middle y to top / low y
    //   let deltaX = Math.max(midX - leftX, rightX - midX);

    //   // The visible tiles form a rhombus
    //   for (let dX = 0; dX <= deltaX; dX++) {
    //     for (let x of [midX - dX, midX + dX]) {
    //       for (let y = topY + dX; y <= lowY - dX; y++) {
    //         console.log(x, y);
    //       }
    //     }
    //   }

    //   for (let x = extremes.leftmostX; x <= extremes.rightmostX; x++) {
    //     for (let y = extremes.topmostY; y <= extremes.lowermostY; y++) {
    //       this.onTileOver({ x, y });
    //     }
    //   }
    // };
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
      this.mapMatrix[y] &&
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
      )
        .setDepth(CST.LAYER_DEPTH.TILES)
        .setActive(false);
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
        for (let x = 0; x < this.mapWidth; x++) {
          for (let y = 0; y < this.mapHeight; y++) {
            if (!this.tilesInPlace[y]) {
              continue;
            }

            let usedTile = this.tilesInPlace[y][x];

            if (!usedTile) {
              continue;
            }

            usedTile.setVisible(false);

            this.unusedPool.push(usedTile);
          }
        }

        this.initTilesInPlace();

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
    let extremes = this.isoBoard.getExtremesTileCoords();

    // Keep the intersection between oldView and the newView worth of tiles, discard the difference
    if (this.oldView) {
      let unusedRects = rectDifference(this.oldView, extremes);

      // Remove old rects of unused tiles
      for (let rect of unusedRects) {
        for (let x = rect.leftmostX; x <= rect.rightmostX; x++) {
          for (let y = rect.topmostY; y <= rect.lowermostY; y++) {
            if (!this.tilesInPlace[y]) {
              continue;
            }

            let tile = this.tilesInPlace[y][x];

            if (!tile) {
              continue;
            }

            this.unusedPool.push(tile);

            tile.setVisible(false);

            if (this.cliffsSparseMatrix[y] && this.cliffsSparseMatrix[y][x]) {
              this.cliffsSparseMatrix[y][x].setVisible(false);
            }

            this.tilesInPlace[y][x] = null;
          }
        }
      }
    }

    this.oldView = extremes;

    // console.log(extremes);

    for (let x = extremes.leftmostX; x <= extremes.rightmostX; x++) {
      for (let y = extremes.topmostY; y <= extremes.lowermostY; y++) {
        // visibleTiles.forEach(({ x, y }) => {
        // there is no tile to be drawn
        if (
          !this.mapMatrix[y] ||
          this.mapMatrix[y][x] === CST.ENVIRONMENT.EMPTY_TILE
        ) {
          // return;
          continue;
        }
        // also if this tile is already in place, don't reposition it
        if (this.tilesInPlace[y][x]) {
          // return;
          continue;
        }

        // if a cliff should be drawn underneath this tile
        if (this.cliffsSparseMatrix[y] && this.cliffsSparseMatrix[y][x]) {
          this.cliffsSparseMatrix[y][x].setVisible(true);
        }

        // get an unused tile at x, y tile coords
        let tile = this.getUnusedTile(x, y);

        // push this tile in the pool of used tiles and mark it as being in place
        // this.usedPool.push(tile);
        this.tilesInPlace[y][x] = tile;
      }
    }
    // );

    // redrew tiles, this viewRectangle is not dirty anymore
    this.isoBoard.viewRectangleDirty = false;
    return this;
  }

  private generateCliffs() {
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        if (
          this.mapMatrix[y] &&
          this.mapMatrix[y][x] !== CST.ENVIRONMENT.EMPTY_TILE
        ) {
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
              .setVisible(false)
              .setActive(false);
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
        this.tilesInPlace[i][j] = null;
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

function createView(
  leftmostX: number,
  rightmostX: number,
  topmostY: number,
  lowermostY: number
): ViewExtremes {
  return {
    leftmostX,
    rightmostX,
    topmostY,
    lowermostY
  };
}

// Return the difference of two view rectangles
// Code adapted from https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Rectangle_difference
function rectDifference(
  oldView: ViewExtremes,
  newView: ViewExtremes
): ViewExtremes[] {
  let result: ViewExtremes[] = [];

  // compute the top rectangle
  let raHeight = newView.topmostY - oldView.topmostY;

  if (raHeight > 0) {
    result.push(
      createView(
        oldView.leftmostX,
        oldView.rightmostX,
        oldView.topmostY,
        newView.topmostY
      )
    );
  }

  // compute the bottom rectangle
  let rbHeight = oldView.lowermostY - newView.lowermostY;

  if (rbHeight > 0 && newView.lowermostY < oldView.lowermostY) {
    result.push(
      createView(
        oldView.leftmostX,
        oldView.rightmostX,
        newView.lowermostY,
        oldView.lowermostY
      )
    );
  }

  let y1 =
    newView.topmostY > oldView.topmostY ? newView.topmostY : oldView.topmostY;
  let y2 =
    newView.lowermostY < oldView.lowermostY
      ? newView.lowermostY
      : oldView.lowermostY;
  let rcHeight = y2 - y1;

  // compute the left rectangle
  let rcWidth = newView.leftmostX - oldView.leftmostX;

  if (rcWidth > 0 && rcHeight > 0) {
    result.push(createView(oldView.leftmostX, newView.leftmostX, y1, y2));
  }

  // compute the right rectangle
  let rdWidth = oldView.rightmostX - newView.rightmostX;

  if (rdWidth > 0) {
    result.push(createView(newView.rightmostX, oldView.rightmostX, y1, y2));
  }

  return result;
}
