import { Board, QuadGrid } from "phaser3-rex-plugins/plugins/board-components";
import { IsoScene, Point3 } from "./IsoPlugin";

import CST from "../CST";
import KDBush from "kdbush";

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
  // the map matrix is needed for initing the RTree
  // and drawing the grid
  mapMatrix: number[][];
}

// let DEBUG_GRAPHICS: Phaser.GameObjects.Graphics;

/*
 * Singleton class that handles tile and grid logic
 */
export default class IsoBoard {
  public static instance: IsoBoard = null;

  // the graphics object used to draw the board grid
  private graphics: Phaser.GameObjects.Graphics;
  private visibleGrid: boolean = false;

  // the rectangle that contains the tiles currently in view
  private viewRectangle: Phaser.Geom.Rectangle;
  // a KD-tree which hold the mid points of all the tiles,
  // this way we can easily get the viewable tiles for drawing
  tilesIndex: KDBush;
  // array of tiles with their corresponding midPoints
  tilesWithMidPoints: Array<{
    x: number;
    y: number;
    tileX: number;
    tileY: number;
  }>;

  // if the view rectangle changed we should redraw the tiles on the screen
  public viewRectangleDirty: boolean = true;

  // hold a reference to the main camera
  camera: Phaser.Cameras.Scene2D.Camera;
  board: Board;
  // the gameSize
  gameSize: { width: number; height: number };
  // the map position and size in world space
  mapSize: {
    w: number;
    h: number;
    tileW: number;
    tileH: number;
  };

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

    // the width and height of the board in px
    this.mapSize = {
      w: config.tileWidth * config.mapWidth,
      h: config.tileHeight * config.mapHeight,
      tileW: config.tileWidth,
      tileH: config.tileHeight
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
      .setDepth(CST.GRID.GRID_DEPTH);

    // when the real camera moves, the grid should move with it
    this.camera = config.scene.cameras.main;

    this.initListeners();

    // DEBUG_GRAPHICS = this.board.scene.add.graphics({
    //   lineStyle: {
    //     width: 10,
    //     color: 0xff0000,
    //     alpha: 1
    //   }
    // });
    this.updateViewRectangle();
    this.initKDBush(config.mapMatrix);
  }

  private initListeners() {
    this.camera
      .on(CST.CAMERA.MOVE_EVENT, () => {
        this.viewRectangleDirty = true;
      })
      .on(CST.CAMERA.ZOOM_EVENT, (actualZoomFactor: number) => {
        this.viewRectangleDirty = true;

        // if the game is zoomed out too much, the grid will hide
        if (this.camera.zoom <= CST.GRID.ZOOM_DEACTIVATE) {
          this.hideGrid();
        }
      });

    // update the view rect every update cycle
    this.board.scene.events.on("preupdate", () => {
      this.updateViewRectangle();
      this.drawGrid();
    });

    // when the game screen resizes, the board has to be repositioned according to the projector
    this.board.scene.scale.on(
      "resize",
      () => {
        // determine the position of the map corner
        let { x: mapX, y: mapY } = this.board.scene.iso.projector.project(
          new Point3(0, 0, 0)
        );

        this.board.grid.x = mapX;
        this.board.grid.y = mapY;
      },
      this
    );
  }

  private updateViewRectangle() {
    // pad the view rectangle with 10 tiles all around
    let view = this.camera.worldView,
      padX = CST.CAMERA.VIEWRECT_TILE_PAD * this.mapSize.tileW,
      padY = CST.CAMERA.VIEWRECT_TILE_PAD * this.mapSize.tileH;

    let oldRect = this.viewRectangle;

    this.viewRectangle = new Phaser.Geom.Rectangle(
      view.x - padX,
      view.y - padY,
      view.width + padX * 2,
      view.height + padY * 2
    );

    if (
      !oldRect ||
      oldRect.x !== this.viewRectangle.x ||
      oldRect.y !== this.viewRectangle.y ||
      oldRect.width !== this.viewRectangle.width ||
      oldRect.height !== this.viewRectangle.height
    ) {
      this.viewRectangleDirty = true;
    }

    // DEBUG_GRAPHICS.clear().strokeRect(
    //   this.viewRectangle.x,
    //   this.viewRectangle.y,
    //   this.viewRectangle.width,
    //   this.viewRectangle.height
    // );
  }

  // draw the grid once on the gridBufferTexture
  private drawGrid() {
    // grid not visible, return
    if (!this.visibleGrid) {
      this.graphics.setVisible(false);

      return;
    } else {
      // the grid was invisible until now
      if (!this.graphics.visible) {
        this.graphics.setVisible(true);
      }
      // the grid was already visible and the camera view didn't change
      else if (!this.viewRectangleDirty) {
        return;
      }
    }

    this.graphics.clear();

    // draw the board so it fills the whole grid buffer texture
    this.getTilesInView().forEach((tileXY: TileXY) => {
      // get the corners of this tile
      let tilePoints = this.board.getGridPoints(tileXY.x, tileXY.y, true);

      this.graphics.strokePoints(tilePoints, true);
    });
  }

  showGrid(): this {
    this.visibleGrid = true;

    return this;
  }

  hideGrid(): this {
    this.visibleGrid = false;

    return this;
  }

  public initKDBush(mapMatrix: number[][]) {
    this.tilesWithMidPoints = [];

    const BOTTOM = 1,
      RIGHT = 0;

    // take the mid point of each tile
    this.board.forEachTileXY((tileXY: TileXY) => {
      // if there's no tile here no point in drawing grid stroke
      if (!mapMatrix[tileXY.y] || !mapMatrix[tileXY.y][tileXY.x]) {
        return;
      }

      // get the midPoint of this tile
      let tilePoints = this.board.getGridPoints(tileXY.x, tileXY.y, true);

      let midX = tilePoints[BOTTOM].x,
        midY = tilePoints[RIGHT].y;

      this.tilesWithMidPoints.push({
        x: midX,
        y: midY,
        tileX: tileXY.x,
        tileY: tileXY.y
      });
    });

    // index the midPoints of each tile so they are easily found within the viewRect
    this.tilesIndex = new KDBush(
      this.tilesWithMidPoints,
      (p: TileXY) => p.x,
      (p: TileXY) => p.y
    );
  }

  public isTileInView(tileXY: TileXY): boolean {
    // get the corners of this tile
    let tilePoints = this.board.getGridPoints(tileXY.x, tileXY.y, true);

    let midX = tilePoints[1].x,
      midY = tilePoints[0].y;
    return this.viewRectangle.contains(midX, midY);
  }

  // returns an array of (x, y) pairs that are the tile coordinates of the viewable tiles
  public getTilesInView(): TileXY[] {
    // search in the KD-Tree what midPoints are within the view area
    const rect = this.viewRectangle,
      results = this.tilesIndex
        .range(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height)
        .map((id: number) => this.tilesWithMidPoints[id])
        .map(({ tileX, tileY }) => ({ x: tileX, y: tileY }));

    return results;
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
