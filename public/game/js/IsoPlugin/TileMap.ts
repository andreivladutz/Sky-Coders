import { Board, QuadGrid } from "phaser3-rex-plugins/plugins/board-components";
import IsoPlugin, { IsoSprite, IsoScene, Point3 } from "../IsoPlugin/IsoPlugin";
import IsoBoard, { TileXY } from "./IsoBoard";

import { IsoDebugger } from "../utils/debug";

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
  // the real tiles i.e. real isoSprites
  tilesMatrix: DynamicIsoSprite[][] = [];

  tileLayerGroup: Phaser.GameObjects.Group;
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

    this.isoBoard = IsoBoard.getInstance({
      scene: this.scene,
      x: this.mapX,
      y: this.mapY,
      tileWidth: config.tileWidth,
      tileHeight: config.tileHeight,
      mapWidth: config.mapWidth,
      mapHeight: config.mapHeight
    }).showGrid();

    this.isoDebug = new IsoDebugger(
      this.scene,
      this.scene.iso
    ).enableDebugging();

    // the map data with tile indices
    this.mapMatrix = config.mapMatrix;
    // the phaser group of tile spritesheet
    this.tileLayerGroup = this.scene.add.group();
    this.initTilesMatrix();

    // check every update cycle if the viewport moved
    // if so, redraw all tiles
    this.scene.events.on("update", () => {
      if (this.isoBoard.viewRectangleDirty) {
        this.redrawTiles();
      }
    });

    // add event listeners on the underlying board
    this.setBoardInteractive();
  }

  setBoardInteractive() {
    this.isoBoard.board
      .setInteractive()
      .on("tilemove", (pointer, tileXY: TileXY) => {
        let x = tileXY.x,
          y = tileXY.y;

        if (this.lastTintedTile && this.lastTintedTile.tinted) {
          this.lastTintedTile.clearTint();

          this.lastTintedTile.tinted = false;
        }

        if (this.tilesMatrix[y][x] && !this.tilesMatrix[y][x].tinted) {
          this.tilesMatrix[y][x].setTint(0x86bfda);

          this.tilesMatrix[y][x].tinted = true;
          this.lastTintedTile = this.tilesMatrix[y][x];
        }
      });
  }

  /**
   * Redraw tiles using existing ones, or
   * when there aren't enough tiles in the tileLayerGroup pool of tiles
   * add new ones
   */
  redrawTiles(): this {
    // only redraw the visible tiles
    let visibleTiles = this.isoBoard.getTilesInView();

    // the already defined tiles
    let tilePool = this.tileLayerGroup.getChildren(),
      // we need the index of the last tile reused, so we hide and deactivate the rest of the unused tiles
      lastIndex = 0;

    visibleTiles.forEach(({ x, y }, index: number) => {
      // there is no tile to be drawn
      if (!this.mapMatrix[y] || this.mapMatrix[y][x] === 0) {
        return;
      }

      // get this nth tile from the tile pool
      let tile: DynamicIsoSprite = tilePool[index] as DynamicIsoSprite;

      // if no tile is found, create a new one
      if (!tile) {
        tile = this.scene.add
          .isoSprite(
            x * this.tileHeight,
            y * this.tileHeight,
            0,
            "GROUND_TILES.floor",
            this.tileLayerGroup
          )
          .setOrigin(0.5, 0.5);
      }
      // tile already exists, reuse this one
      else {
        tile.isoX = x * this.tileHeight;
        tile.isoY = y * this.tileHeight;
      }

      this.tilesMatrix[y][x] = tile.setVisible(true).setActive(true);
      lastIndex = index;
    });

    // deactivate and hide the rest of the tiles
    for (let i = lastIndex + 1; i < tilePool.length; i++) {
      (tilePool[i] as DynamicIsoSprite).setActive(false).setVisible(false);
    }

    // redrew tiles, this viewRectangle is not dirty anymore
    this.isoBoard.viewRectangleDirty = false;
    return this;
  }

  // make the tiles matrix as "tall" as the mapMatrix
  private initTilesMatrix() {
    for (let i = 0; i < this.mapMatrix.length; i++) {
      this.tilesMatrix[i] = [];
    }
  }

  drawTilesDebug(): this {
    this.isoDebug.debugIsoSprites(
      this.tileLayerGroup.getChildren() as Array<IsoSprite>,
      0xeb4034,
      false
    );

    return this;
  }
}
