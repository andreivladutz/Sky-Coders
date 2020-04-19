import * as BuildingTypes from "./BuildingTypes";

// The first message sent by the server to the client for initialising the game
export namespace GameInit {
  export interface Config {
    seed: string;
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
