import { Board, QuadGrid } from "phaser3-rex-plugins/plugins/board-components";
import { IsoScene } from "./IsoPlugin";

import CST from "../CST";

const QUAD_GRID = "quadGrid",
  ISO_GRID_TYPE = "isometric";

export interface TileXY {
  x: number;
  y: number;
}

interface IsoBoardConfig {
  scene: IsoScene;
  x: number;
  y: number;
  tileWidth: number;
  tileHeight: number;
  mapWidth: number;
  mapHeight: number;
}

let DEBUG_GRAPHICS: Phaser.GameObjects.Graphics;

/*
 * Singleton class that handles tile and grid logic
 */
export default class IsoBoard {
  public static instance: IsoBoard = null;

  // the graphics object used to draw the board grid
  private graphics: Phaser.GameObjects.Graphics;
  // this texture holds the whole drawn grid for efficiency purposes
  private gridBufferTexture: Phaser.GameObjects.RenderTexture;
  // the rectangles that contains the tiles currently in view
  private viewRectangle: Phaser.Geom.Rectangle;
  // if the view rectangle changed we should redraw the tiles on the screen
  public viewRectangleDirty: boolean = true;

  // hold a reference to the main camera
  camera: Phaser.Cameras.Scene2D.Camera;
  board: Board;
  // the gameSize
  gameSize: { width: number; height: number };
  // the map position and size in world space
  mapSize: {
    x: number;
    y: number;
    w: number;
    h: number;
    tileW: number;
    tileH: number;
  };

  ZOOM_FACTOR: { x: number; y: number };

  private constructor(config: IsoBoardConfig) {
    const boardConfig = {
      grid: {
        gridType: QUAD_GRID,
        x: config.x,
        y: config.y,
        cellWidth: config.tileWidth,
        cellHeight: config.tileHeight,
        type: ISO_GRID_TYPE,
        dir: 8
      },
      width: config.mapWidth,
      height: config.mapHeight
    };

    // the used board texture
    this.board = new Board(config.scene, boardConfig);

    // the real gameSize
    this.gameSize = config.scene.game.scale.gameSize;

    // how much the buffer should be scaled compared to the gameSize
    const SCALE = CST.GRID.BUFFER.SCALE;

    this.gridBufferTexture = config.scene.add
      .renderTexture(
        0,
        0,
        this.gameSize.width * SCALE,
        this.gameSize.height * SCALE
      )
      .setVisible(true)
      .setDepth(Infinity);

    // the width and height of the board in px
    this.mapSize = {
      x: config.x,
      y: config.y,
      w: config.tileWidth * config.mapWidth,
      h: config.tileHeight * config.mapHeight,
      tileW: config.tileWidth,
      tileH: config.tileHeight
    };

    // the scale used to draw the whole grid on the grid buffer
    this.ZOOM_FACTOR = {
      x: (this.gameSize.width * SCALE) / this.mapSize.w,
      y: (this.gameSize.height * SCALE) / this.mapSize.h
    };

    // the graphics used to draw the grid on the buffer texture
    this.graphics = config.scene.add
      .graphics({
        lineStyle: {
          width: CST.GRID.LINE_WIDTH,
          color: CST.GRID.LINE_COLOR,
          alpha: CST.GRID.LINE_ALPHA
        }
      })
      .setVisible(false);

    // when the real camera moves, the grid should move with it
    this.camera = config.scene.cameras.main;

    DEBUG_GRAPHICS = this.board.scene.add.graphics({
      lineStyle: {
        width: 10,
        color: 0xff0000,
        alpha: 1
      }
    });
    this.updateViewRectangle();

    this.camera
      .on(CST.CAMERA.MOVE_EVENT, () => {
        //this.updateViewRectangle();
        this.viewRectangleDirty = true;
      })
      .on(CST.CAMERA.ZOOM_EVENT, (actualZoomFactor: number) => {
        //this.updateViewRectangle();
        this.viewRectangleDirty = true;
      });

    this.board.scene.events.on("preupdate", () => {
      this.updateViewRectangle();
    });

    this.drawGrid();
  }

  private updateViewRectangle() {
    // pad the view rectangle with 10 tiles all around
    let view = this.camera.worldView,
      padX = CST.CAMERA.VIEWRECT_TILE_PAD * this.mapSize.tileW,
      padY = CST.CAMERA.VIEWRECT_TILE_PAD * this.mapSize.tileH;

    this.viewRectangle = new Phaser.Geom.Rectangle(
      view.x - padX,
      view.y - padY,
      view.width + padX * 2,
      view.height + padY * 2
    );

    DEBUG_GRAPHICS.clear().strokeRect(
      this.viewRectangle.x,
      this.viewRectangle.y,
      this.viewRectangle.width,
      this.viewRectangle.height
    );
  }

  // draw the grid once on the gridBufferTexture
  private drawGrid() {
    this.graphics.clear();

    let scale = Math.min(this.ZOOM_FACTOR.x, this.ZOOM_FACTOR.y);

    // draw the board so it fills the whole grid buffer texture
    this.board.forEachTileXY((tileXY: TileXY) => {
      // get the corners of this tile
      let tilePoints = this.board
        .getGridPoints(tileXY.x, tileXY.y, true)
        .map((pt: TileXY) => {
          // translate the tile at (0, 0) to (screenMiddle, 0) so the whole
          // board can be drawn on this buffer RenderTexture
          pt.x -= this.mapSize.x - this.mapSize.w / 2;
          pt.y -= this.mapSize.y - this.mapSize.tileH / 2;

          // scale the points so the whole board fits
          return { x: pt.x * scale, y: pt.y * scale };
        });

      this.graphics.strokePoints(tilePoints, true);
    });

    // buffer the grid lines
    this.gridBufferTexture.draw(this.graphics);

    // reverse the translation and scale so we get the real world sized grid
    this.gridBufferTexture
      .setX(this.mapSize.x - this.mapSize.w / 2)
      .setY(this.mapSize.y - this.mapSize.tileH / 2)
      .setScale(1 / scale);
  }

  showGrid(): this {
    this.gridBufferTexture.setVisible(true);

    return this;
  }

  hideGrid(): this {
    this.gridBufferTexture.setVisible(false);

    return this;
  }

  // returns an array of (x, y) pairs that are the tile coordinates of the viewable tiles
  public getTilesInView(): TileXY[] {
    let inView = [];

    this.board.forEachTileXY((tileXY: TileXY) => {
      // get the corners of this tile
      let tilePoints = this.board.getGridPoints(tileXY.x, tileXY.y, true);

      let midX = tilePoints[1].x,
        midY = tilePoints[0].y;

      if (this.viewRectangle.contains(midX, midY)) {
        inView.push({ x: tileXY.x, y: tileXY.y });
      }
    });

    return inView;
  }

  public static getInstance(config?: IsoBoardConfig) {
    if (IsoBoard.instance === null) {
      if (!config) {
        throw new Error(
          "A config object should be provided to the first call to getInstance(config?)"
        );
      }

      IsoBoard.instance = new IsoBoard(config);
    }

    return IsoBoard.instance;
  }
}
