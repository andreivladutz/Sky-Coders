import { IsoSprite, IsoScene, Point3 } from "../IsoPlugin/IsoPlugin";
import IsoBoard, { TileXY } from "./IsoBoard";
import IsoTile from "./IsoTile";

import { IsoDebugger } from "../utils/debug";

import List, { Node } from "../utils/List";

import CST from "../CST";
import Phaser from "phaser";

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

  // World position of the (0, 0) tile
  mapX: number;
  mapY: number;

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

  // always remember the last tinted tile so we can clear its tint when we leave the tile
  lastTintedTile: DynamicIsoSprite;

  constructor(config: TileMapConfig) {
    this.scene = config.scene;

    // the used projector
    let projector = this.scene.iso.projector;

    // determine the position of the map corner
    ({ x: this.mapX, y: this.mapY } = projector.project(new Point3(0, 0, 0)));

    this.tileWidth = config.tileWidth;
    this.tileHeight = config.tileHeight;
    this.mapWidth = config.mapWidth;
    this.mapHeight = config.mapHeight;

    this.isoBoard = IsoBoard.getInstance({
      scene: this.scene,
      x: this.mapX,
      y: this.mapY,
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

  setBoardInteractive() {
    this.isoBoard.board.setInteractive();
    //   .on("tilemove", (pointer, tileXY: TileXY) => {
    //     let x = tileXY.x,
    //       y = tileXY.y;
    //     if (this.lastTintedTile && this.lastTintedTile.tinted) {
    //       this.lastTintedTile.clearTint();
    //       this.lastTintedTile.tinted = false;
    //     }
    //     if (this.tilesMatrix[y][x] && !this.tilesMatrix[y][x].tinted) {
    //       this.tilesMatrix[y][x].setTint(0x86bfda);
    //       this.tilesMatrix[y][x].tinted = true;
    //       this.lastTintedTile = this.tilesMatrix[y][x];
    //     }
    //   });

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
      if (!this.mapMatrix[y] || this.mapMatrix[y][x] === 0) {
        return;
      }
      // also if this tile is already in place, don't reposition it
      if (this.tilesInPlace[y][x]) {
        return;
      }

      // get this last tile from the unused pool
      let tile = this.unusedPool.pop();

      // if no tile is found, create a new one
      if (!tile) {
        tile = new IsoTile(
          this.scene,
          x * this.tileHeight,
          y * this.tileHeight,
          x,
          y,
          "GROUND_TILES.floor"
        ).setOrigin(0.5, 0.5);

        this.scene.add.existing(tile);
      }
      // an unused tile already exists, reuse this one
      else {
        tile
          .set3DPosition(x * this.tileHeight, y * this.tileHeight, 0)
          .setTilePosition(x, y)
          .setVisible(true);

        //// HERE SHOULD BE CHECKED IF THE TEXTURE IS THE CORRECT ONE. OTHERWISE CHANGE IT!!!
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
