import IsoSpriteObject, { GridColor } from "./IsoSpriteObject";
import CST from "../CST";

import BuildingsManager from "../managers/BuildingsManager";
import CameraManager from "../managers/CameraManager";
import MapManager from "../managers/MapManager";
import IsoScene from "../IsoPlugin/IsoScene";
import LayersManager from "../managers/LayersManager";

interface Tile {
  x: number;
  y: number;
}

export default class BuildingObject extends IsoSpriteObject {
  // whether this building can be moved
  movementEnabled: boolean = false;
  // whether the building can be placed at current tile positions or not
  canBePlacedHere: boolean = false;

  /**
   * @param buildingType from CST.BUILDING.TYPES
   */
  //@ts-ignore
  constructor(scene: IsoScene, buildingType: string) {
    const buildManager = BuildingsManager.getInstance();

    // get the details of this specific building => frame, texture and localTiles of the grid
    let buildingFrame = buildManager.buildingFrames[buildingType],
      textureKey = buildManager.getTextureKey(),
      { localTileX, localTileY } = CST.BUILDINGS.CONFIG[buildingType];

    super(
      scene,
      0,
      0,
      0,
      CST.LAYERS.OBJ_ID.BUILDING,
      textureKey,
      buildingFrame,
      // Do not place it on the layer of objects
      false,
      // override local computed tiles
      localTileX,
      localTileY
    );

    // Try to position this building at the center of the screen
    let { x, y } = CameraManager.getInstance().getWorldPointAtCenter();

    let mapManager = MapManager.getInstance(),
      mapSize = mapManager.getMapTilesize();

    let { x: tileX, y: tileY } = mapManager.worldToTileCoords(x, y);

    let halfWidthX = this.tileWidthX - this.localTileX,
      halfWidthY = this.tileWidthY - this.localTileY;

    // the tile coords of the screen mid can be out out bounds, clamp them to the bounds
    tileX = Phaser.Math.Clamp(tileX, halfWidthX, mapSize.w - halfWidthX - 1);
    tileY = Phaser.Math.Clamp(tileY, halfWidthY, mapSize.h - halfWidthY - 1);

    this.setTilePosition(tileX, tileY);

    // this.layersManager.debugLayers(scene);
  }

  public canBePlaced() {
    return this.canBePlacedHere;
  }

  // removes this building permanently
  public removeBuilding() {
    if (!this.movementEnabled) {
      this.layersManager.removeObjectFromLayer(this);
    }

    this.mapManager.removeSpriteObjectFromBoard(this);
    this.destroy();
    // also destroy the grid graphics
    this.gridGraphics.destroy();
  }

  // drag this game object to worldX worldY position
  public dragToWorldXY(worldX: number, worldY: number): this {
    let tileCoords = this.mapManager.worldToTileCoords(worldX, worldY),
      deltaX = tileCoords.x - this.tileX,
      deltaY = tileCoords.y - this.tileY;

    return this.moveBuilding(deltaX, deltaY);
  }

  // returns whether the building can be placed or not
  // if it cannot be placed, it will be REMOVED permanently
  // and if it can be, then it also places it in the spot it is in
  placeBuilding(): boolean {
    if (!this.canBePlacedHere) {
      this.removeBuilding();

      return false;
    }

    // hide the grid
    this.disableGridDrawing();
    this.applyToLayer();
    // also apply it to rexBoard
    this.addToGridAt(this.tileX, this.tileY);

    this.movementEnabled = false;

    // the building could be placed
    return true;
  }

  // enable the placement of this building with the ui elements
  enableBuildPlacing(): this {
    // remove this particular building object from the layer
    // before starting to move it => and then add it back to the grid

    // if the object hasn't been already placed on the grid this method is safe as it exits
    if (this.isAppliedToLayer) {
      this.layersManager.removeObjectFromLayer(this);
    }

    this.mapManager.kickOutSpriteObjectFromBoard(this);

    this.movementEnabled = true;
    this.checkGridColor();

    return this;
  }

  // move the building with delta coords
  moveBuilding(deltaX: number, deltaY: number): this {
    if (!this.movementEnabled) {
      return;
    }

    let tileX = this.tileX + deltaX,
      tileY = this.tileY + deltaY;

    // if any of the grid tiles ends up outside the bounds of the map, don't move
    for (let futureTile of this.getGridTiles(tileX, tileY)) {
      if (isOutOfBounds(futureTile)) {
        return;
      }
    }

    super.setTilePosition(tileX, tileY);
    // keeping the building on the board while moving caused problems to actors
    // this.mapManager.moveSpriteObjectToTiles(this, tileX, tileY);

    this.checkGridColor();

    return this;
  }

  // check if the building is coliding with another game object
  // then the grid should be red to indicat that we cannot place the building here
  private checkGridColor(): this {
    if (!this.movementEnabled) {
      return this;
    }

    // Check collision against other objects, also against all actors in the scene
    if (this.layersManager.isColliding(this, true)) {
      this.canBePlacedHere = false;
      this.enableGridDrawing(GridColor.RED);
    } else {
      this.canBePlacedHere = true;
      this.enableGridDrawing(GridColor.GREEN);
    }

    return this;
  }
}

function isOutOfBounds(tile: Tile) {
  let mapSize = MapManager.getInstance().getMapTilesize();

  if (tile.x < 0 || tile.x >= mapSize.w || tile.y < 0 || tile.y >= mapSize.h) {
    return true;
  }

  return false;
}
