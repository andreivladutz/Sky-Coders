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

    let { x, y } = CameraManager.getInstance().getWorldPointAtCenter();

    let { x: tileX, y: tileY } = MapManager.getInstance().worldToTileCoords(
      x,
      y
    );

    // TODO: remove hardcoded values. CAN BE OUT OF BOUNDS ^^^
    tileX = tileY = 50;

    super(
      scene,
      tileX,
      tileY,
      0,
      CST.LAYERS.OBJ_ID.BUILDING,
      textureKey,
      buildingFrame,
      // override local computed tiles
      localTileX,
      localTileY
    );

    // this.layersManager.debugLayers(scene);
  }

  // drag this game object to worldX worldY position
  public dragToWorldXY(worldX: number, worldY: number): this {
    let tileCoords = this.mapManager.worldToTileCoords(worldX, worldY),
      deltaX = tileCoords.x - this.tileX,
      deltaY = tileCoords.y - this.tileY;

    return this.moveBuilding(deltaX, deltaY);
  }

  // enable the placement of this building with the ui elements
  enableBuildPlacing(): this {
    // remove this particular building object from the layer
    // before starting to move it => and then add it back to the grid

    // if the object hasn't been already placed on the grid this method is safe as it exits
    this.layersManager.removeObjectFromLayer(this);

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
    this.mapManager.moveSpriteObjectToTiles(this, tileX, tileY);

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
