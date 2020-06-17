import IsoSpriteObject, { GridColor } from "./IsoSpriteObject";
import CST from "../CST";

import BuildingsManager from "../managers/BuildingsManager";
import CameraManager from "../managers/CameraManager";
import MapManager from "../managers/MapManager";
import IsoScene from "../IsoPlugin/IsoScene";
// import LayersManager from "../managers/LayersManager";
import BuildingTypes, { BuildNames } from "../../../common/BuildingTypes";
import ActorsManager from "../managers/ActorsManager";
import Modal from "../ui/Modal";

interface Tile {
  x: number;
  y: number;
}

export default class BuildingObject extends IsoSpriteObject {
  public buildingType: BuildNames;
  // The last time this building produced resources (were collected)
  public lastProdTime: number;

  // whether this building can be moved
  private movementEnabled: boolean = false;
  // whether the building can be placed at current tile positions or not
  private canBePlacedHere: boolean = false;

  /**
   * @param buildingType from CST.BUILDING.TYPES
   */
  constructor(
    scene: IsoScene,
    buildingType: BuildNames,
    textureKey: string,
    buildingFrame: string | number,
    localTileX: number,
    localTileY: number,
    // Optionally, specify the tile coords of this building
    tileX?: number,
    tileY?: number
  ) {
    super({
      scene,
      tileX: tileX ?? 0,
      tileY: tileY ?? 0,
      objectId: CST.LAYERS.OBJ_ID.BUILDING,
      texture: textureKey,
      frame: buildingFrame,
      // Do not place it on the layer of objects
      shouldBeAppliedToLayer: false,
      // override local computed tiles
      localTileX,
      localTileY
    });

    this.buildingType = buildingType;

    if (typeof tileX === "undefined") {
      this.positionToCenter();
    }

    // this.layersManager.debugLayers(scene);
  }

  public makeInteractive(): this {
    this.makeSelectable().setSelectedTintColor(CST.ACTOR.SELECTION_TINT);

    // when this actor gets SELECTED
    this.on(CST.EVENTS.OBJECT.SELECT, () => {
      this.setTint();
      this.actorWalkToBuilding();

      console.log("BUILDING SELECTED");
    });

    // when this actor gets DESELECTED
    this.on(CST.EVENTS.OBJECT.DESELECT, () => {
      this.actorWalkToBuilding();
      console.log("BUILDING DESELECTED");
    });

    return this;
  }

  // Send an actor to a certain building
  public actorWalkToBuilding(
    currActor = ActorsManager.getInstance().selectedActor
  ): this {
    if (currActor) {
      currActor.navigateToObject([
        {
          x: this.tileX + 3,
          y: this.tileY + 3
        }
      ]);
    }

    return this;
  }

  private positionToCenter() {
    // Try to position this building at the center of the screen
    let { x, y } = CameraManager.getInstance().getWorldPointAtCenter();

    let mapManager = MapManager.getInstance(),
      mapSize = mapManager.getMapTilesize();

    let { x: tileX, y: tileY } = mapManager.worldToTileCoords(x, y);

    let halfWidthX = this.tileWidthX - this.localTileX,
      halfWidthY = this.tileWidthY - this.localTileY;

    // the tile coords of the screen mid can be out out bounds, clamp them to the world bounds
    tileX = Phaser.Math.Clamp(tileX, halfWidthX, mapSize.w - halfWidthX - 1);
    tileY = Phaser.Math.Clamp(tileY, halfWidthY, mapSize.h - halfWidthY - 1);

    this.setTilePosition(tileX, tileY);
  }

  public canBePlaced() {
    return this.canBePlacedHere;
  }

  // removes this building permanently
  public removeBuilding() {
    if (!this.movementEnabled) {
      this.layersManager.removeObjectFromLayer(this);
    }

    this.disableInteractive();

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

  /**
   * returns whether the building can be placed or not
   * if it cannot be placed, it will be REMOVED permanently
   * and if it can be, then it also places it in the spot it is in
   *
   * @param emitPlacingToServer whether the building placement should be emited to the server @default true
   */
  placeBuilding(emitPlacingToServer = true): boolean {
    if (!this.canBePlacedHere) {
      this.removeBuilding();

      return false;
    }

    this.makeInteractive();

    // hide the grid
    this.disableGridDrawing();
    this.applyToLayer();
    // also apply it to rexBoard
    this.addToGridAt(this.tileX, this.tileY);

    this.movementEnabled = false;

    // The building can now start producing resources
    this.lastProdTime = Date.now();

    if (emitPlacingToServer) {
      // Let the buildings manager know a building has been placed
      BuildingsManager.getInstance().onBuildingPlaced(this);
    }

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
