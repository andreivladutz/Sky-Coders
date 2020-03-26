import IsoSpriteObject from "./IsoSpriteObject";
import CST from "../CST";

import BuildingsManager from "../managers/BuildingsManager";
import CameraManager from "../managers/CameraManager";
import MapManager from "../managers/MapManager";
import IsoScene from "../IsoPlugin/IsoScene";

export default class BuildingObject extends IsoSpriteObject {
  /**
   * @param buildingType from CST.BUILDING.TYPES
   */
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
  }
}
