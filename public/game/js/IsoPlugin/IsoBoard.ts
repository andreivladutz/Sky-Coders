import { Board, QuadGrid } from "phaser3-rex-plugins/plugins/board-components";
import { IsoScene, Point3 } from "./IsoPlugin";

import CST from "../CST";
import KDBush from "kdbush";

const QUAD_GRID = "quadGrid",
  ISO_GRID_TYPE = "isometric";

// the corners of a tile received from the underlying board
const BOTTOM = 1,
  RIGHT = 0,
  LEFT = 2,
  TOP = 3;

export interface TileXY {
  x: number;
  y: number;
}

// projections for TileXYs
const projX = ({ x }: TileXY) => x,
  projY = ({ y }: TileXY) => y;

// Get an array of tiles and two projection functions that get the x or the y properties of a tile
// Sorts by the main property, then by the secondary one
function sortTiles(
  tiles: TileXY[],
  mainProj: (t: TileXY) => number,
  otherProj: (t: TileXY) => number
) {
  let compFunc = (a: TileXY, b: TileXY): number => {
    let mainDiff = mainProj(a) - mainProj(b);

    // sort by the secondary property
    if (mainDiff === 0) {
      return otherProj(a) - otherProj(b);
    }

    return mainDiff;
  };

  return tiles.sort(compFunc);
}

// returns tiles that give grid lines
function getLinePairs(
  tiles: TileXY[],
  mainProj: (t: TileXY) => number,
  otherProj: (t: TileXY) => number
): Array<[TileXY, TileXY]> {
  let lineTiles = [];

  tiles = sortTiles(tiles, mainProj, otherProj);

  // the big interval on main property
  let currPropVal = -1,
    // the ends of the interval on the secondary property
    // which define the ends of a line (segment)
    otherPropMin: TileXY = null,
    otherPropMax: TileXY = null;

  let abs = Math.abs;

  for (let i = 0; i < tiles.length; i++) {
    let tile = tiles[i];

    // the main property changed, get the min and max for the secondary prop for this new interval
    // we also have to check the continuity of the line
    if (
      mainProj(tile) !== currPropVal ||
      abs(otherProj(tiles[i - 1]) - otherProj(tile)) > 1
    ) {
      // if this isn't the first iteration on the main property, push the ends of the found line
      if (otherPropMax !== null && otherPropMin !== null) {
        lineTiles.push([otherPropMin, otherPropMax]);
      }

      currPropVal = mainProj(tile);
      otherPropMin = otherPropMax = tile;
    } else {
      // don't have to check if the new found tile's secondary property is bigger than the current maximum
      // they are sorted, so we are sure this is the new max
      otherPropMax = tile;
    }
  }

  // don't forget to push the last tiles which are the ends to a line in the grid
  if (otherPropMax !== null && otherPropMin !== null) {
    lineTiles.push([otherPropMin, otherPropMax]);
  }

  return lineTiles;
}

type IndexedTileSegments = { [key: number]: Array<[TileXY, TileXY]> };

// A segment determined by the tile ends
type TileLine = [TileXY, TileXY];

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

  // the lines that compose this grid
  // split all the tiles into lines so it requires less resources to draw the grid
  horizontalGridLines: IndexedTileSegments;
  verticalGridLines: IndexedTileSegments;

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

    this.updateViewRectangle();
    this.initKDBush(config.mapMatrix);

    this.initGridLines(config.mapMatrix);
  }

  private initListeners() {
    // TODO: emit these events somewhere else, not on the camera
    this.camera
      .on(CST.CAMERA.MOVE_EVENT, () => {
        //this.viewRectangleDirty = true;
        this.updateViewRectangle();
      })
      .on(CST.CAMERA.ZOOM_EVENT, (actualZoomFactor: number) => {
        this.updateViewRectangle();
        //this.viewRectangleDirty = true;

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

    let newRect = new Phaser.Geom.Rectangle(
      view.x - padX / 2,
      view.y - padY / 2,
      view.width + padX,
      view.height + padY
    );

    if (
      this.viewRectangle &&
      Phaser.Geom.Rectangle.ContainsRect(this.viewRectangle, newRect)
    ) {
      return;
    }

    this.viewRectangle = newRect;

    newRect.x -= padX / 2;
    newRect.y -= padY / 2;
    (newRect.width += padX), (newRect.height += padY);

    this.viewRectangleDirty = true;

    // if (
    //   !oldRect ||
    //   oldRect.x !== this.viewRectangle.x ||
    //   oldRect.y !== this.viewRectangle.y ||
    //   oldRect.width !== this.viewRectangle.width ||
    //   oldRect.height !== this.viewRectangle.height
    // ) {
    //   this.viewRectangleDirty = true;
    // }

    // DEBUG_GRAPHICS.clear().strokeRect(
    //   this.viewRectangle.x,
    //   this.viewRectangle.y,
    //   this.viewRectangle.width,
    //   this.viewRectangle.height
    // );
  }

  // init the vertical and horizontal lines of this grid internally
  private initGridLines(mapMatrix: number[][]) {
    // get all the tiles of this grid
    let tiles: TileXY[] = [];

    this.board.forEachTileXY((tileXY: TileXY) => {
      if (!mapMatrix[tileXY.y] || !mapMatrix[tileXY.y][tileXY.x]) {
        return;
      }

      let tileXYCopy: TileXY = {
        x: tileXY.x,
        y: tileXY.y
      };

      tiles.push(tileXYCopy);
    });

    // index the horizontal and vertical lines by the y / by the x coord
    // for example there can be multiple lines at a y coordinate if there are missing tiles on this row in the map
    this.horizontalGridLines = getLinePairs(tiles, projY, projX).reduce(
      (
        accObj: IndexedTileSegments,
        currVal: [TileXY, TileXY]
      ): IndexedTileSegments => {
        if (typeof accObj[currVal[0].y] === "undefined") {
          accObj[currVal[0].y] = [currVal];
        } else {
          accObj[currVal[0].y].push(currVal);
        }

        return accObj;
      },
      {}
    );

    this.verticalGridLines = getLinePairs(tiles, projX, projY).reduce(
      (
        accObj: IndexedTileSegments,
        currVal: [TileXY, TileXY]
      ): IndexedTileSegments => {
        if (typeof accObj[currVal[0].x] === "undefined") {
          accObj[currVal[0].x] = [currVal];
        } else {
          accObj[currVal[0].x].push(currVal);
        }

        return accObj;
      },
      {}
    );
  }

  private getVerticalGridLines(): Array<TileLine> {
    let verticalLines: Array<TileLine> = [];

    let leftmostTile = this.board.worldXYToTileXY(
        this.viewRectangle.x,
        this.viewRectangle.y
      ),
      rightmostTile = this.board.worldXYToTileXY(
        this.viewRectangle.x + this.viewRectangle.width,
        this.viewRectangle.y + this.viewRectangle.height
      );

    let leftmostX = Math.max(leftmostTile.x, 0),
      rightmostX = Math.min(rightmostTile.x, this.mapSize.tileW);

    for (let x = leftmostX; x <= rightmostX; x++) {
      verticalLines.push(...this.verticalGridLines[x]);
    }

    return verticalLines;
  }

  private getHorizontalGridLines(): Array<TileLine> {
    let horizontalLines = [];

    let topmostTile = this.board.worldXYToTileXY(
        this.viewRectangle.x + this.viewRectangle.width,
        this.viewRectangle.y
      ),
      lowermostTile = this.board.worldXYToTileXY(
        this.viewRectangle.x,
        this.viewRectangle.y + this.viewRectangle.height
      );

    let topmostY = Math.max(topmostTile.y, 0),
      lowermostY = Math.min(lowermostTile.y, this.mapSize.tileH);

    for (let y = topmostY; y <= lowermostY; y++) {
      horizontalLines.push(...this.horizontalGridLines[y]);
    }

    return horizontalLines;
  }

  // draw the grid once on the gridBufferTexture
  // view rectangle becomes "not dirty" once all the tiles have been redrawn
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

    this.drawTilesOnGrid();
  }

  // public method to draw the outline and maybe fill of some tiles on the grid
  // if a non-zero fill alpha is provided the shape will also be filled.
  // THE METHOD SUPPOSES THE FILL SHAPES ARE RECTANGULAR
  public drawTilesOnGrid(
    tiles: TileXY[] = [],
    strokeColor: number = CST.COLORS.WHITE,
    lineWidth: number = 1,
    fillAlpha: number = 0,
    fillColor: number = CST.COLORS.WHITE,
    // if userGraphicsObj is provided, the grid is drawn on
    // that graphics object, otherwise the internal one is used
    userGraphicsObj: Phaser.GameObjects.Graphics = null
  ) {
    if (!this.viewRectangleDirty) {
      return;
    }

    let graphics = userGraphicsObj ? userGraphicsObj : this.graphics;

    graphics.clear();

    // the shape will be stroked only if fillAlpha is 0
    graphics.lineStyle(lineWidth, strokeColor, 1);

    if (fillAlpha !== 0) {
      graphics.fillStyle(fillColor, fillAlpha);
    }

    let verticalLineEnds = this.drawVerticalGridLines(tiles, graphics);

    this.fillRectGrid(verticalLineEnds, graphics, fillAlpha);

    this.drawHorizontalGridLines(tiles, graphics);
  }

  // instead of drawing each tile, get the tiles which are extremities to grid lines
  // and draw only lines:
  private drawVerticalGridLines(
    tiles: TileXY[],
    graphics: Phaser.GameObjects.Graphics
  ): Array<TileLine> {
    // get and draw the vertical lines
    let lineEnds: Array<TileLine>;

    // using this function to draw internal grid
    // if so no point in computing the vertical lines each time
    if (graphics === this.graphics) {
      lineEnds = this.getVerticalGridLines();
    } else {
      lineEnds = getLinePairs(tiles, projX, projY);
    }

    lineEnds.forEach(([topTile, bottomTile]: TileLine) => {
      // get the corners of this tile
      let topTilePoints = this.board.getGridPoints(topTile.x, topTile.y),
        bottomTilePoints = this.board.getGridPoints(bottomTile.x, bottomTile.y);

      // stroke the lines
      graphics.strokePoints(
        [topTilePoints[TOP], bottomTilePoints[LEFT]],
        false
      );

      graphics.strokePoints(
        [topTilePoints[RIGHT], bottomTilePoints[BOTTOM]],
        false
      );
    });

    return lineEnds;
  }

  private drawHorizontalGridLines(
    tiles: TileXY[],
    graphics: Phaser.GameObjects.Graphics
  ): Array<TileLine> {
    // get and draw the horizontal lines
    let lineEnds: Array<TileLine>;

    // using this function to draw internal grid
    // if so no point in computing the horizontal lines each time
    if (graphics === this.graphics) {
      lineEnds = this.getHorizontalGridLines();
    } else {
      lineEnds = getLinePairs(tiles, projY, projX);
    }

    lineEnds.forEach(([leftTile, rightTile]: [TileXY, TileXY]) => {
      // get the corners of this tile
      let leftTilePoints = this.board.getGridPoints(leftTile.x, leftTile.y),
        rightTilePoints = this.board.getGridPoints(rightTile.x, rightTile.y);

      // stroke the lines
      graphics.strokePoints(
        [leftTilePoints[TOP], rightTilePoints[RIGHT]],
        false
      );

      graphics.strokePoints(
        [leftTilePoints[LEFT], rightTilePoints[BOTTOM]],
        false
      );
    });

    return lineEnds;
  }

  private fillRectGrid(
    verticalLineEnds: Array<TileLine>,
    graphics: Phaser.GameObjects.Graphics,
    fillAlpha: number
  ): void {
    if (fillAlpha !== 0) {
      // the first and the last vertical lines are enough to define
      // the rectangular grid shape to be filled
      let rectEnds = [
          verticalLineEnds[0],
          verticalLineEnds[verticalLineEnds.length - 1].reverse()
        ],
        rectPoints: TileXY[] = [];

      rectEnds.flat().forEach((tileXY: TileXY, idx: number) => {
        // get the corners of this tile
        let tilePoints = this.board.getGridPoints(tileXY.x, tileXY.y);

        switch (idx) {
          case 0:
            rectPoints.push(tilePoints[TOP]);
            break;
          case 1:
            rectPoints.push(tilePoints[LEFT]);
            break;
          case 2:
            rectPoints.push(tilePoints[BOTTOM]);
            break;
          case 3:
            rectPoints.push(tilePoints[RIGHT]);
            break;
        }
      });
      graphics.fillPoints(rectPoints, true);
    }
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
