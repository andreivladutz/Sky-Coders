import { BuildingPlacement } from "../../../common/MessageTypes";
import SocketManager from "./SocketManager";
import BuildingsManager from "../managers/BuildingsManager";
import IsoScene from "../IsoPlugin/IsoScene";

/**
 * When placing a building, the server takes the final decisions
 *  Whether the user has enough resources, whether the positioning is valid
 *
 */
export default class BuildingsMessenger {
  private socketManager: SocketManager;
  private buildsManager: BuildingsManager;

  // Keep the buildings until they get fetched by the mapManager
  private _initialBuildings: BuildingPlacement.DbBuilding[];
  public set initialBuildings(buildings: BuildingPlacement.DbBuilding[]) {
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
    this.socketManager = socketManager;
    this.buildsManager = BuildingsManager.getInstance();

    this.registerEventListening();
  }

  /**
   *  Send a message to the server informing it that a building has been placed client-side
   *  @param buildingInfo The tile positioning and type of the building. Optionally last production time
   *
   *  The server decides if the placement is valid or not
   */
  public buildingPlacementMessage(buildingInfo: BuildingPlacement.DbBuilding) {
    // Request the server to place this building
    this.socketManager.emit(BuildingPlacement.REQUEST_EVENT, buildingInfo);
  }

  /**
   *
   * @param responseEvent APPROVE_EVENT or DENY_EVENT whether the sv accepted or not the placement
   * @param resourcesStatus The resources status after processing the placement request
   */
  private handlePlacementResponse(
    responseEvent: string,
    resourcesStatus: BuildingPlacement.ResourcesAfterPlacement
  ) {
    switch (responseEvent) {
      case BuildingPlacement.APPROVE_EVENT:
        this.buildsManager.onPlacementAllowed(resourcesStatus);
        break;
      case BuildingPlacement.DENY_EVENT:
        this.buildsManager.onPlacementDenied(resourcesStatus);
        break;
    }
  }

  /**
   * Listen to buildings-related events
   */
  private registerEventListening() {
    // The server accepts the placement of a building
    this.socketManager.on(
      BuildingPlacement.APPROVE_EVENT,
      this.handlePlacementResponse.bind(this, BuildingPlacement.APPROVE_EVENT)
    );

    // The server denies the placement of a building
    this.socketManager.on(
      BuildingPlacement.DENY_EVENT,
      this.handlePlacementResponse.bind(this, BuildingPlacement.DENY_EVENT)
    );
  }
}
