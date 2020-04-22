import RBush, { BBox } from "rbush";
import BuildingTypes, {
  DbBuildingInfo,
  BuildingType,
  Resources
} from "../../public/common/BuildingTypes";

import { BuildingPlacement } from "../../public/common/MessageTypes";
import GameInstance from "./GameInstance";

import CST from "../SERVER_CST";

import { NamespaceDebugger } from "../utils/debug";
const debug = new NamespaceDebugger("BuildingsManager");

type DbInfo = DbBuildingInfo;
type ResAfterPlace = BuildingPlacement.ResourcesAfterPlacement;

// Index buildings in an rTree for fast retrieving
// and collision checking (i.e. not allowing the user to place overlaying buildings)
class IndexedBuilding implements BBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  // The building document saved in the db
  dbBuildingDoc: DbInfo;
  // A reference to the building type
  buildingType: BuildingType;

  constructor(dbBuilding: DbInfo) {
    this.dbBuildingDoc = dbBuilding;
    this.buildingType = BuildingTypes[dbBuilding.buildingType];

    this.computeBBox();
  }

  // Compute the bounding box of the base, the grid ocuppied by the building
  private computeBBox() {
    // Position of the "origin" on the local grid
    let { localTileX, localTileY } = this.buildingType.localPos;
    // The size in tiles of this building
    let { widthX, widthY } = this.buildingType.size;
    // The position in the world
    let { x, y } = this.dbBuildingDoc.position;

    this.minX = x - localTileX;
    this.minY = y - localTileY;
    this.maxX = this.minX + widthX - 1;
    this.maxY = this.minY + widthY - 1;
  }
}

// Manage buildings for a connected client
export default class BuildingsManager {
  private rTree: RBush<IndexedBuilding>;
  private gameInstanceParent: GameInstance;

  private get islandDoc() {
    return this.gameInstanceParent.currIslandDocument;
  }
  private get userDoc() {
    return this.gameInstanceParent.user;
  }
  private get sender() {
    return this.gameInstanceParent.sender;
  }
  // Get the resources on the game object of this user
  private get resourcesDoc() {
    return this.userDoc.game.resources;
  }

  constructor(gameInstance: GameInstance) {
    this.rTree = new RBush();

    this.gameInstanceParent = gameInstance;
    gameInstance.on(CST.EVENTS.GAME.INITED, () => this.loadBuildings());
  }

  // Load the existing buildings into the rTree
  public loadBuildings() {
    let buildingsToIndex = this.islandDoc.buildings.map(
      (dbBuilding: DbInfo) => new IndexedBuilding(dbBuilding)
    );

    this.rTree.load(buildingsToIndex);
  }

  // Init listeners on the BufferMessenger used by gameInstance (`sender` property)
  public initListeners() {
    // Client player placed a building on the map
    this.sender.on(BuildingPlacement.REQUEST_EVENT, (buildingInfo: DbInfo) =>
      this.handleBuildPlacement(buildingInfo)
    );
  }

  private handleBuildPlacement(buildingInfo: DbInfo) {
    // Prepare the building for indexing in the RTree, also get the building type object
    let indexedBuilding = new IndexedBuilding(buildingInfo);

    // Make sure the user affords the building and also that it isn't overlayed with other buildings
    let placementLegal: boolean =
      this.hasEnoughResources(indexedBuilding) &&
      !this.rTree.collides(indexedBuilding);

    if (placementLegal) {
      this.islandDoc.buildings.push(buildingInfo);
      this.rTree.insert(indexedBuilding);
    }

    this.debugPlacement(buildingInfo, placementLegal);
    this.acknowledgeBuildingPlace(indexedBuilding, placementLegal);
  }

  /**
   * Send a response to the client's event request whether the placement has been accepted or not
   * @param approved
   */
  private acknowledgeBuildingPlace(
    indexedBuilding: IndexedBuilding,
    approved: boolean
  ) {
    let responseEvent = approved
      ? BuildingPlacement.APPROVE_EVENT
      : BuildingPlacement.DENY_EVENT;

    let resourcesAfterPlacing = this.resourcesAfterPlace(
      indexedBuilding,
      approved
    );

    this.sender.emit(responseEvent, resourcesAfterPlacing);
  }

  /**
   *
   * @param indexedBuilding the building trying to be placed, wrapped in the class indexed in the rtree
   * @param accepted whether the placement has been accepted or denied
   */
  private resourcesAfterPlace(
    indexedBuilding: IndexedBuilding,
    accepted: boolean
  ): ResAfterPlace {
    // The resources consumed for placing this building
    let costResources = indexedBuilding.buildingType.buildCost,
      // Resources before "buying"
      currResources = this.resourcesDoc;

    // If the placing is accepted, spend resources on it, otherwise, the resources stay the same
    let resourcesAfterPlacing = (accepted
      ? this.spendResources(currResources, costResources, true)
      : currResources) as ResAfterPlace;

    return {
      coins: resourcesAfterPlacing.coins,
      buildingPosition: indexedBuilding.dbBuildingDoc.position
    };
  }

  /**
   * Spend resources on a building
   * @param currResources user resources before buying
   * @param costResources the cost of a building
   * @param modifyInPlace whether the currResources object should be modified or
   * another one should be created and returned
   */
  private spendResources(
    currResources: Resources,
    costResources: Resources,
    modifyInPlace = false
  ): Resources {
    let spendableResources: Resources;

    if (modifyInPlace) {
      spendableResources = currResources;
    } else {
      // Copy the currResources
      spendableResources = {
        coins: currResources.coins
      };
    }

    spendableResources.coins -= costResources.coins;

    return spendableResources;
  }

  /**
   * Check whether the user has enough resources to buy and place this building
   * @param indexedBuilding the building to be placed
   */
  private hasEnoughResources(indexedBuilding: IndexedBuilding): boolean {
    // The resources consumed for placing this building
    let costResources = indexedBuilding.buildingType.buildCost,
      // Resources before "buying"
      currResources = this.resourcesDoc;

    let resourcesAfterSpending = this.spendResources(
      currResources,
      costResources
    );

    // If any resource becomes negative, then the user cannot afford the building
    for (let resource of Object.values(resourcesAfterSpending)) {
      if (resource < 0) {
        return false;
      }
    }

    return true;
  }

  private debugPlacement(buildingInfo: DbInfo, couldAfford: boolean) {
    debug.userHas(
      this.userDoc,
      `placed a ${buildingInfo.buildingType} building at (${buildingInfo.position.x}, ${buildingInfo.position.y})`
    );

    if (!couldAfford) {
      debug.debug("The building was removed as the placement was not legal.");
    }
  }
}
