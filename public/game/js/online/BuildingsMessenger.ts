import { Buildings } from "../../../common/MessageTypes";
import BuildingsManager from "../managers/BuildingsManager";
import SocketManager from "./SocketManager";
import Messenger from "./Messenger";
import BuildingObject from "../gameObjects/BuildingObject";

/**
 * When placing a building, the server takes the final decisions
 *  Whether the user has enough resources, whether the positioning is valid
 *
 */
export default class BuildingsMessenger extends Messenger {
  private buildsManager: BuildingsManager;

  // Keep the buildings until they get fetched by the mapManager
  private _initialBuildings: Buildings.DbBuilding[];
  public set initialBuildings(buildings: Buildings.DbBuilding[]) {
    // Initial building can be set only once (by the gameManager)
    if (this._initialBuildings === null) {
      return;
    }

    this._initialBuildings = buildings;
  }
  public get initialBuildings() {
    let buildings = this._initialBuildings;

    delete this._initialBuildings;
    this._initialBuildings = null;

    return buildings;
  }

  constructor(socketManager: SocketManager) {
    super(socketManager);
    this.buildsManager = BuildingsManager.getInstance();
  }

  /**
   *  Send a message to the server informing it that a building has been placed client-side
   *  @param buildingInfo The tile positioning and type of the building. Optionally last production time
   *
   *  The server decides if the placement is valid or not
   */
  public buildingPlacementMessage(buildingInfo: Buildings.ClientBuilding) {
    // Request the server to place this building
    this.socketManager.emit(Buildings.REQUEST_EVENT, buildingInfo);
  }

  // Send a request to collect the building with dbId
  // Pass an ACK function so we get the response directly to this specific building and event
  public collectBuildingMessage(building: BuildingObject) {
    this.socketManager.emit(
      Buildings.COLLECTED_EVENT,
      building.dbId,
      this.collectAckWithClosure(building)
    );
  }

  /**
   *
   * @param responseEvent APPROVE_EVENT or DENY_EVENT whether the sv accepted or not the placement
   * @param resourcesStatus The resources status after processing the placement request
   */
  private handlePlacementResponse(
    responseEvent: string,
    resourcesStatus: Buildings.ResourcesAfterPlacement
  ) {
    switch (responseEvent) {
      case Buildings.APPROVE_EVENT:
        this.buildsManager.onPlacementAllowed(resourcesStatus);
        break;
      case Buildings.DENY_EVENT:
        this.buildsManager.onPlacementDenied(resourcesStatus);
        break;
    }
  }

  // Create and return an ack function that has closure over the building that sent the collect request event
  private collectAckWithClosure(building: BuildingObject) {
    /**
     * Process the response from the server after a collect request
     * (The acknowledge cb passed to COLLECTED_EVENT emit)
     *
     * @param responseEvent ACCEPT_COLLECT_EVENT or DENY_COLLECT_EVENT
     * @param resourcesStatus The resources after processing the collect request
     */
    return (
      responseEvent: string,
      resourcesStatus: Buildings.ResourcesAfterCollect
    ) => {
      if (building.dbId !== resourcesStatus._id) {
        throw new Error(
          "BuildingsMessenger Error: The collected building's id differs from the received _id."
        );
      }

      // if (responseEvent === Buildings.ACCEPT_COLLECT_EVENT) {
      //   this.buildsManager.onCollectionAccepted(building, resourcesStatus);
      // } else if (responseEvent === Buildings.DENY_COLLECT_EVENT) {
      //   this.buildsManager.onCollectionDenied(building, resourcesStatus);
      // }

      this.buildsManager.onCollectionResolved(building, resourcesStatus);
    };
  }

  /**
   * Listen to buildings-related events
   */
  protected registerEventListening() {
    // The server accepts the placement of a building
    this.socketManager.on(
      Buildings.APPROVE_EVENT,
      this.handlePlacementResponse.bind(this, Buildings.APPROVE_EVENT)
    );

    // The server denies the placement of a building
    this.socketManager.on(
      Buildings.DENY_EVENT,
      this.handlePlacementResponse.bind(this, Buildings.DENY_EVENT)
    );
  }
}
