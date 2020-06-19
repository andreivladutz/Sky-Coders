import RBush, { BBox } from "rbush";
import BuildingTypes, {
  BuildingType,
  Resources
} from "../../public/common/BuildingTypes";

import { ObjectId } from "mongodb";

import { Buildings } from "../../public/common/MessageTypes";
import GameInstance from "./GameInstance";

import CST from "../SERVER_CST";

import { NamespaceDebugger } from "../utils/debug";
import GameObjectsManager from "./GameObjectsManager";
const debug = new NamespaceDebugger("BuildingsManager");

type DbInfo = Buildings.DbBuilding;
type ResAfterPlace = Buildings.ResourcesAfterPlacement;

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
  // No need to store the building type on each instance
  public get buildingType(): BuildingType {
    return BuildingTypes[this.dbBuildingDoc.buildingType];
  }

  constructor(dbBuilding: DbInfo) {
    this.dbBuildingDoc = dbBuilding;

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
export default class BuildingsManager extends GameObjectsManager {
  private rTree: RBush<IndexedBuilding>;

  constructor(gameInstance: GameInstance) {
    super(gameInstance);

    this.rTree = new RBush();

    gameInstance.on(CST.EVENTS.GAME.INITED, () => {
      this.loadBuildings();
    });
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
    this.sender.on(
      Buildings.REQUEST_EVENT,
      this.handleBuildPlacement.bind(this)
    );

    this.sender.on(
      Buildings.COLLECTED_EVENT,
      this.handleCollectEvent.bind(this)
    );
  }

  // Method used to clean up the internals when a user logs out
  public cleanUp() {
    // clearInterval(this.buildingsUpdateInterval);
  }

  // The user collected a building. Check if the collection was valid
  private handleCollectEvent(buildingId: string, ackCb: Buildings.CollectAck) {
    let collectedBuild = this.islandDoc.buildings.id(buildingId);
    let responseEvent: string;

    // If the collected building doesn't exist then deny the collection
    if (!collectedBuild) {
      responseEvent = Buildings.DENY_COLLECT_EVENT;
    } else {
      // Get the type this building belongs to
      let buildingType = BuildingTypes[collectedBuild.buildingType];

      // Check if the production is ready (i.e. the building has something to collect)
      if (
        Date.now() - collectedBuild.lastProdTime >=
        buildingType.productionTime
      ) {
        responseEvent = Buildings.ACCEPT_COLLECT_EVENT;
      } else {
        responseEvent = Buildings.DENY_COLLECT_EVENT;
      }
    }

    let currResources: Resources = this.resourcesDoc,
      resourcesAfter: Resources;

    // The collection has been accepted so we should collect resources
    if (responseEvent === Buildings.ACCEPT_COLLECT_EVENT) {
      let { productionResources } = BuildingTypes[collectedBuild.buildingType];

      // TODO: If more resources, count them in here
      let collectResources = {
        coins: -productionResources.coins
      };

      // Spend negative resources i.e. collect !
      resourcesAfter = this.spendResources(
        currResources,
        collectResources,
        true
      );

      // The building has just been collected now
      collectedBuild.lastProdTime = Date.now();
    } else {
      resourcesAfter = currResources;
    }

    // Respond with the resources status for this building
    let responseResources: Buildings.ResourcesAfterCollect = {
      // TODO: keep an eye for more resources
      coins: resourcesAfter.coins,
      _id: buildingId,
      lastProdTime: collectedBuild.lastProdTime
    };

    ackCb(responseEvent, responseResources);
  }

  // Get the type and the position of the building the user is trying to place on the map
  // And apply the logic needed to check the validity of this placement
  private handleBuildPlacement(clientBuilding: Buildings.ClientBuilding) {
    let { buildingType, position } = clientBuilding;

    let buildingInfo = {
      _id: new ObjectId(),
      buildingType,
      position,
      lastProdTime: Date.now()
    };
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
      ? Buildings.APPROVE_EVENT
      : Buildings.DENY_EVENT;

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

    // Also send the db _id to the server so we can easily identify a building by the db id
    return {
      _id: indexedBuilding.dbBuildingDoc._id,
      // TODO: Check out the resources status
      coins: resourcesAfterPlacing.coins,
      buildingPosition: indexedBuilding.dbBuildingDoc.position
    };
  }

  /**
   * Spend resources on a building ( If the resources to spend are negative than it's a collect function :) )
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
      // TODO: If more resources later, change the copy logic
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
