import { TileXY, IsoBoardConfig, ViewExtremes } from "./IsoBoard";
import CST from "../CST";
import BoardViewer from "./BoardViewer";

type IndexedTileSegments = { [key: number]: Array<[TileXY, TileXY]> };
// A segment determined by the tile ends
type TileLine = [TileXY, TileXY];

// the corners of a tile received from the underlying board
const BOTTOM = 1,
  RIGHT = 0,
  LEFT = 2,
  TOP = 3;

// All logic related to grid drawing used by the isoboard
export default class BoardGrid extends BoardViewer {
  // the lines that compose this grid
  // split all the tiles into lines so it requires less resources to draw the grid
  private horizontalGridLines: IndexedTileSegments;
  private verticalGridLines: IndexedTileSegments;

  // the graphics object used to draw the board grid
  private graphics: Phaser.GameObjects.Graphics;
  private visibleGrid: boolean = false;

  public constructor(config: IsoBoardConfig) {
    super(config);

    // the graphics used to draw the grid on the buffer texture
    this.graphics = config.scene.add
      .graphics({
        lineStyle: {
          width: CST.GRID.LINE_WIDTH,
          color: CST.GRID.LINE_COLOR,
          alpha: CST.GRID.LINE_ALPHA
        }
      })
      .setDepth(CST.LAYER_DEPTH.WORLD_GRID);

    this.initGridLines(config.mapMatrix);
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

    let { leftmostX, rightmostX } = this.getExtremesTileCoords();

    for (let x = leftmostX; x <= rightmostX; x++) {
      if (this.verticalGridLines[x]) {
        verticalLines.push(...this.verticalGridLines[x]);
      }
    }

    return verticalLines;
  }

  private getHorizontalGridLines(): Array<TileLine> {
    let { topmostY, lowermostY } = this.getExtremesTileCoords();

    let horizontalLines = [];

    for (let y = topmostY; y <= lowermostY; y++) {
      if (this.horizontalGridLines[y]) {
        horizontalLines.push(...this.horizontalGridLines[y]);
      }
    }

    return horizontalLines;
  }

  // draw the grid once on the gridBufferTexture
  // view rectangle becomes "not dirty" once all the tiles have been redrawn
  protected drawGrid() {
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
    let graphics = userGraphicsObj ? userGraphicsObj : this.graphics;

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

  // Grid filling -> useful for drawing the grid fill when placing a building (green / red)
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
