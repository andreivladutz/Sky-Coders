import * as BuildingTypes from "./BuildingTypes";

//  The server doesn't differentiate between a connection and a reconnection
export namespace Connection {
  export const CONNECT_EVENT = "first_connect";
  export const RECONNECT_EVENT = "client_reconnect";

  export const INIT_UIDS_EVENT = "init_uids";

  // These uids are transmitted on first connection from the server
  // to the client (via the GameInit event). On reconnection, the client sends them back to the sv
  export interface Uids {
    socketUid: string;
    userUid: string;
  }
}

// The first message sent by the server to the client for initialising the game
export namespace GameInit {
  export interface Config {
    seed: string;
    // The buildings already placed by the user on the map
    buildings: BuildingTypes.DbBuildingInfo[];
  }

  export const EVENT = "game_init";
}

// Redirect event, useful for redirecting the client to another path
export namespace Redirect {
  export const EVENT = "redirect";
  export type Path = string;
}

export namespace GameLoaded {
  export const EVENT = "game_loaded";
}

export namespace BuildingPlacement {
  // Request the placement of a building to the server
  export const REQUEST_EVENT = "building_placed";
  // Placement approved
  export const APPROVE_EVENT = "placement_approved";
  // Placement denied
  export const DENY_EVENT = "placement_deny";

  export type DbBuilding = BuildingTypes.DbBuildingInfo;
  // When the placement gets approved, resource status is updated
  // Also, we need to identify the subject, i.e. the building, by its unique position
  export interface ResourcesAfterPlacement extends BuildingTypes.Resources {
    buildingPosition: BuildingTypes.TilePosition;
  }
}
