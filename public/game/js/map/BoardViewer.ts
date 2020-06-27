import { Board } from "phaser3-rex-plugins/plugins/board-components";

import { IsoBoardConfig, ViewExtremes } from "./IsoBoard";
import CameraManager from "../managers/CameraManager";
import CST from "../CST";
import MapManager from "../managers/MapManager";

const QUAD_GRID = "quadGrid",
  ISO_GRID_TYPE = "isometric";

// Class containing the view rectangle logic and such for the BoardGrid and IsoBoard child classes
export default class BoardViewer {
  // the rectangle that contains the tiles currently in view
  protected viewRectangle: Phaser.Geom.Rectangle;
  // if the view rectangle changed we should redraw the tiles on the screen
  public viewRectangleDirty: boolean = true;

  // game main camera (the one used by the cameraManager)
  public camera: Phaser.Cameras.Scene2D.Camera;

  // the map position and size in world space
  protected mapSize: {
    w: number;
    h: number;
    tileW: number;
    tileH: number;
  };

  // The board rexPlugin
  public board: Board;

  constructor(config: IsoBoardConfig) {
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

    // adding this to fix a typo in Rex's Plugin AStar PathFinding
    this.board.tileXYToWroldX = this.board.tileXYToWorldX;
    this.board.tileXYToWroldY = this.board.tileXYToWorldY;

    // the width and height of the board in px
    this.mapSize = {
      w: config.tileWidth * config.mapWidth,
      h: config.tileHeight * config.mapHeight,
      tileW: config.tileWidth,
      tileH: config.tileHeight
    };

    this.camera = config.scene.cameras.main;
    this.updateViewRectangle();
  }

  // Get the extreme coordinates of the current view
  public getExtremesTileCoords(useRealViewport: boolean = false): ViewExtremes {
    let viewRect = useRealViewport
      ? CameraManager.getInstance().getViewRect()
      : this.viewRectangle;

    return this.getExtremeTilesInRect(viewRect);
  }

  public getExtremeTilesInRect(viewRect: Phaser.Geom.Rectangle): ViewExtremes {
    const mapWith = this.mapSize.w / this.mapSize.tileW - 1,
      mapHeight = this.mapSize.h / this.mapSize.tileH - 1;

    let leftmostTile = this.board.worldXYToTileXY(viewRect.x, viewRect.y),
      rightmostTile = this.board.worldXYToTileXY(
        viewRect.x + viewRect.width,
        viewRect.y + viewRect.height
      ),
      topmostTile = this.board.worldXYToTileXY(
        viewRect.x + viewRect.width,
        viewRect.y
      ),
      lowermostTile = this.board.worldXYToTileXY(
        viewRect.x,
        viewRect.y + viewRect.height
      );

    let topmostY = Math.max(topmostTile.y, 0),
      lowermostY = Math.min(lowermostTile.y, mapHeight),
      leftmostX = Math.max(leftmostTile.x, 0),
      rightmostX = Math.min(rightmostTile.x, mapWith);

    return {
      rightmostX,
      leftmostX,
      topmostY,
      lowermostY
    };
  }

  protected checkVisibleToInvisibleRatio(): boolean {
    // Get the area covered by a view rect
    let getArea = (rect: ViewExtremes) => {
      return (
        (rect.rightmostX - rect.leftmostX) * (rect.lowermostY - rect.topmostY)
      );
    };

    // The old rect is computed via the old view rectangle (the padded one)
    let oldRect = this.getExtremesTileCoords(),
      // The new rect is computed based on the real, actual view rectangle
      newRect = this.getExtremesTileCoords(true);

    let oldArea = getArea(oldRect),
      newArea = getArea(newRect);

    return oldArea > newArea * CST.TILEMAP.INVISIBLE_DIRTY_RATIO;
  }

  protected updateViewRectangle() {
    let view = this.camera.worldView;

    if (
      this.viewRectangle &&
      Phaser.Geom.Rectangle.ContainsRect(this.viewRectangle, view)
    ) {
      return;
    }

    this.overrideOldRectangle();
  }

  protected overrideOldRectangle() {
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

    this.viewRectangleDirty = true;
    // Inform all other systems that the map became dirty
    MapManager.getInstance().emitDirtyViewRectEvent(this.viewRectangle);
  }
}
