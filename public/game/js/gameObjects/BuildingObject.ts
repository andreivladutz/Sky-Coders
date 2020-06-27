import IsoSpriteObject, { GridColor } from "./IsoSpriteObject";
import CST from "../CST";

import BuildingsManager from "../managers/BuildingsManager";
import CameraManager from "../managers/CameraManager";
import MapManager from "../managers/MapManager";
import IsoScene from "../IsoPlugin/IsoScene";
// import LayersManager from "../managers/LayersManager";
import BuildingTypes, { BuildNames } from "../../../common/BuildingTypes";
import ActorsManager from "../managers/ActorsManager";
import { SVGCoin } from "../ui/ResourcesUI";
import GameManager from "../online/GameManager";
import { InternalBuilding } from "../Blockly/CODE_CST";

interface Tile {
  x: number;
  y: number;
}

export default class BuildingObject extends IsoSpriteObject {
  public buildingType: BuildNames;
  // Keep the id of the building in the db
  public dbId: string;
  // The last time this building produced resources (were collected)
  // TODO: Show a timer
  public lastProdTime: number;
  // Boolean to know if the production is ready
  public isProductionReady: boolean = false;

  // The coin that's showing above a building when it is collected
  public productionCoin: SVGCoin;

  // whether this building can be moved
  private movementEnabled: boolean = false;
  // whether the building can be placed at current tile positions or not
  private canBePlacedHere: boolean = false;
  protected buildingsManager: BuildingsManager = BuildingsManager.getInstance();

  // The PopoverObject will be imported dynamically the first time it is used
  // The class is available as property on the BuildingsManager
  private popoverObjInstance: import("../ui/uiObjects/bootstrapObjects/PopoverObject").default;

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

  public update() {
    let oldProdReady = this.isProductionReady;

    if (
      Date.now() - this.lastProdTime >=
      BuildingTypes[this.buildingType].productionTime
    ) {
      this.isProductionReady = true;

      // Was false and became true. Show the coin animation
      if (oldProdReady === false) {
        this.buildingsManager.onProductionReady(this);
      }
    } else {
      this.isProductionReady = false;

      // The building was collected, hide the coin
      if (oldProdReady === true) {
        this.buildingsManager.onProductionCollected(this);
      }
    }

    // If a popover is visible, update the timer
    if (this.popoverObjInstance) {
      this.popoverObjInstance.updateContent(this.getCurrentDescription());
    }
  }

  // Get the internal Interpreter representation for this building
  public getInterpreterRepresentation(): InternalBuilding {
    return {
      buildingType: this.buildingType,
      isReady: this.isProductionReady,
      id: this.dbId
    };
  }

  public makeInteractive(): this {
    this.makeSelectable().setSelectedTintColor(CST.BUILDINGS.SELECTION_TINT);

    this.on(CST.EVENTS.OBJECT.LONG_HOVER, this.handleLongHover, this);

    this.on("pointerout", () => {
      if (this.popoverObjInstance) {
        this.popoverObjInstance.hidePopover();
        this.popoverObjInstance = null;
      }
    });

    return this;
  }

  // Show a popover with details about this building
  protected async handleLongHover() {
    if (!this.buildingsManager.PopoverObject) {
      this.buildingsManager.PopoverObject = (
        await import("../ui/uiObjects/bootstrapObjects/PopoverObject")
      ).default;
    }

    let lang = GameManager.getInstance().langFile;
    let pointer = this.scene.input.activePointer;

    this.popoverObjInstance = this.buildingsManager.PopoverObject.getInstance(
      this.scene as IsoScene,
      pointer.worldX,
      pointer.worldY
    ).showPopover(
      lang.buildings.names[this.buildingType],
      this.getCurrentDescription()
    );
  }

  // If the production is not ready yet show a timer
  // Otherwise show a finishedProd description
  protected getCurrentDescription() {
    let descr = GameManager.getInstance().langFile.buildings.description;

    if (this.isProductionReady) {
      return descr.prodReady;
    } else {
      let timeSinceLastProd = Date.now() - this.lastProdTime;
      let remainingTime = Math.floor(
        (BuildingTypes[this.buildingType].productionTime - timeSinceLastProd) /
          1000
      );
      let remainingMins = Math.floor(remainingTime / 60);
      let remainingSec = remainingTime % 60;

      return `${descr.prodNotReady}${
        remainingMins < 10 ? "0" + remainingMins : remainingMins
      }:${remainingSec < 10 ? "0" + remainingSec : remainingSec}`;
    }
  }

  // Handler function for "pointerup" event. Override the one in IsoSpriteObject
  protected handleSelectionToggle = (pointer: Phaser.Input.Pointer) => {
    if (!this.gameCanvasIsTarget(pointer.event)) {
      return;
    }

    this.actorWalkToBuilding();
  };

  // Send an actor to this building for collecting purposes
  public async actorWalkToBuilding(
    currActor = ActorsManager.getInstance().selectedActor
  ) {
    if (currActor) {
      await currActor.navigateToObject(this.getGridTilePadding());
      let reachedDest = await currActor.destinationConclusion;

      if (reachedDest && this.isProductionReady) {
        this.buildingsManager.collectBuilding(this);
      }
    } else {
      let langFile = GameManager.getInstance().langFile;
      let mainUi = this.buildingsManager.resourcesManager.mainUi;
      mainUi.toast.showMsg(langFile.buildings.noActorSelected);
    }
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

    this.removeInteractive();
    // Remove the building from the buildings' phaser group
    this.buildingsManager.sceneBuildings.remove(this);
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
      this.buildingsManager.onBuildingPlaced(this);
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
