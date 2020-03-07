import { IsoSprite, IsoScene, Point3 } from "../IsoPlugin/IsoPlugin";
import IsoBoard from "./IsoBoard";
import IsoTile from "./IsoTile";

import { IsoDebugger } from "../utils/debug";

import List, { Node } from "../utils/List";
import CST from "../CST";
import EnvironmentManager from "../managers/EnvironmentManager";

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
  // debugger class in case debugging is activated
  isoDebug: IsoDebugger;
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

    this.isoDebug = new IsoDebugger(
      this.scene,
      this.scene.iso
    ).enableDebugging();

    // the map data with tile indices
    this.mapMatrix = config.mapMatrix;

    this.envManager = EnvironmentManager.getInstance();

    // init the pools of used and unused tiles
    this.usedPool = new List();
    this.unusedPool = new List();

    // no tile is in place at first
    this.initTilesInPlace();

    // check every update cycle if the viewport moved
    // if so, redraw all tiles
    this.scene.events.on("preupdate", () => {
      if (this.isoBoard.viewRectangleDirty) {
        this.redrawTiles();
      }
    });

    // add event listeners on the underlying board
    this.setBoardInteractive();
  }

  // this method checks if there is any unused tile in the pool of unused tile
  // otherwise allocates a new one
  // and returns a tile at (x, y) TILE coords
  getUnusedTile(x: number, y: number): IsoTile {
    // get this last tile from the unused pool
    let tile: IsoTile = this.unusedPool.pop(),
      texture = this.envManager.getTextureKey(),
      // what should be the frame of this tile
      frame = this.envManager.getGrassFrame(this.mapMatrix[y][x]);

    // if no tile is found, create a new one
    if (!tile) {
      tile = new IsoTile(
        this.scene,
        x * this.tileHeight,
        y * this.tileHeight,
        x,
        y,
        texture,
        frame
      ).setOrigin(0.5, 0.5);
    }
    // an unused tile already exists, reuse this one
    else {
      tile
        .setFrame(frame)
        .set3DPosition(x * this.tileHeight, y * this.tileHeight, 0)
        .setTilePosition(x, y)
        .setVisible(true);
    }

    return tile;
  }

  setBoardInteractive() {
    this.isoBoard.board
      .setInteractive()
      .on("tilemove", (pointer, tileXY: { x: number; y: number }) => {
        let x = tileXY.x,
          y = tileXY.y;

        // don't forget to clear the last tile on tile exit
        if (
          this.lastTintedTile &&
          (this.lastTintedTile.tileX !== x || this.lastTintedTile.tileY !== y)
        ) {
          this.lastTintedTile.destroy();
          this.lastTintedTile = null;
        }

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
            this.envManager.getTextureKey(),
            this.envManager.getGrassFrame(this.mapMatrix[y][x])
          )
            .setOrigin(0.5, 0.5)
            .setTint(0x86bfda);
        }
      });

    // board plugin specific events
    this.isoBoard.board.on("tiletap", () => {
      console.log("TILETAP!");
    });

    this.isoBoard.board.on("tilepressstart", () => {
      console.log("TILEPRESS!");
    });

    // when the game resizes, we should reposition all the tiles
    this.scene.scale.on(
      "resize",
      () => {
        this.initTilesInPlace();

        let usedTile: Node;
        while ((usedTile = this.usedPool.pop())) {
          this.unusedPool.push(usedTile);
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

        this.tilesInPlace[tile.tileY][tile.tileX] = false;
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

      // get an unused tile at x, y tile coords
      let tile = this.getUnusedTile(x, y);

      let flip = Phaser.Math.RND.between(0, 3);
      if (flip == 0) {
        tile.flipX = true;
      } else if (flip === 1) {
        tile.flipY = true;
      } else if (flip == 2) {
        tile.flipX = true;
        tile.flipY = true;
      }

      // push this tile in the pool of used tiles and mark it as being in place
      this.usedPool.push(tile);
      this.tilesInPlace[y][x] = true;
    });

    // redrew tiles, this viewRectangle is not dirty anymore
    this.isoBoard.viewRectangleDirty = false;
    return this;
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

  drawTilesDebug(): this {
    // this.isoDebug.debugIsoSprites(
    //   this.tileLayerGroup.getChildren() as Array<IsoSprite>,
    //   0xeb4034,
    //   false
    // );

    return this;
  }
}
