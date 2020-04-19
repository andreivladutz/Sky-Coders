import { BuildingPlacement } from "../../../common/MessageTypes";
import SocketManager from "./SocketManager";
import BuildingsManager from "../managers/BuildingsManager";

/**
 * When placing a building, the server takes the final decisions
 *  Whether the user has enough resources, whether the positioning is valid
 *
 */
export default class BuildingsMessenger {
  private socketManager: SocketManager;

  constructor(socketManager: SocketManager) {
    this.socketManager = socketManager;

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
    console.log(
      `Server sent a ${responseEvent} event. Resource status ${resourcesStatus}`
    );

    let buildsManager = BuildingsManager.getInstance();

    switch (responseEvent) {
      case BuildingPlacement.APPROVE_EVENT:
        buildsManager.onPlacementAllowed(resourcesStatus);
        break;
      case BuildingPlacement.DENY_EVENT:
        buildsManager.onPlacementDenied(resourcesStatus);
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
