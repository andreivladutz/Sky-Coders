// TODO: NEEDS REFACTORING!!!
import { IsoScene, Point3 } from "../IsoPlugin/IsoPlugin";
import CST from "../CST";
import BoardGrid from "./BoardGrid";
import CameraManager from "../managers/CameraManager";

export interface ViewExtremes {
  leftmostX: number;
  rightmostX: number;
  topmostY: number;
  lowermostY: number;
}

export interface TileXY {
  x: number;
  y: number;
}

export interface IsoBoardConfig {
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
export default class IsoBoard extends BoardGrid {
  public static instance: IsoBoard = null;

  private constructor(config: IsoBoardConfig) {
    super(config);

    this.initListeners();
  }

  private initListeners() {
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

        // redraw everything
        this.overrideOldRectangle();
      },
      this
    );

    // Check if a zoom in leaves out a significant number of tiles that are not visible
    CameraManager.EVENTS.on(CST.CAMERA.ZOOM_EVENT, () => {
      if (this.checkVisibleToInvisibleRatio()) {
        this.overrideOldRectangle();
        this.drawGrid();
      }
    });
  }

  // update the view rect every update cycle
  // called by the map manager
  public onUpdate() {
    this.updateViewRectangle();
    this.drawGrid();
  }

  public isTileInView(tileXY: TileXY): boolean {
    // get the corners of this tile
    let tilePoints = this.board.getGridPoints(tileXY.x, tileXY.y, true);

    let midX = tilePoints[1].x,
      midY = tilePoints[0].y;
    return this.viewRectangle.contains(midX, midY);
  }

  public worldXYToTileXYFloat(worldX: number, worldY: number): TileXY {
    return GetTileXY.call(this.board.grid, worldX, worldY);
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

// get tileXY not rounded
// source code from rex's plugin
let GetTileXY = function(worldX: number, worldY: number): TileXY {
  let out: TileXY = { x: 0, y: 0 };

  worldX -= this.x;
  worldY -= this.y;

  var tmpx = worldX / this.width;
  var tmpy = worldY / this.height;

  out.x = +tmpx + tmpy;
  out.y = -tmpx + tmpy;

  return out;
};
