import * as BuildingTypes from "./BuildingTypes";
import { CharacterDbInfo, Position } from "../../public/common/CharacterTypes";

//  The server doesn't differentiate between a connection and a reconnection
export namespace Connection {
  const PREFIX = "Connection.";
  export const CONNECT_EVENT = `${PREFIX}first_connect`;
  export const RECONNECT_EVENT = `${PREFIX}client_reconnect`;

  export const INIT_UIDS_EVENT = `${PREFIX}init_uids`;

  // Redirect event, useful for redirecting the client to another path
  export const REDIRECT_EVENT = `${PREFIX}redirect`;
  export type Path = string;

  // These uids are transmitted on first connection from the server
  // to the client (via the GameInit event). On reconnection, the client sends them back to the sv
  export interface Uids {
    socketUid: string;
    userUid: string;
  }
}

// The first message sent by the server to the client for initialising the game
export namespace Game {
  const PREFIX = "Game.";

  export interface Config {
    seed: string;
    // The choice of language from the login page
    languageCode: string;
    resources: BuildingTypes.Resources;
    // The buildings already placed by the user on the map
    buildings: BuildingTypes.DbBuildingInfo[];
  }

  export type Resources = BuildingTypes.Resources;

  export const INIT_EVENT = `${PREFIX}game_init`;
  export const LOAD_EVENT = `${PREFIX}game_loaded`;
}

export namespace Buildings {
  const PREFIX = "Building.";

  // Request the placement of a building to the server
  export const REQUEST_EVENT = `${PREFIX}building_placed`;
  // Placement approved
  export const APPROVE_EVENT = `${PREFIX}placement_approved`;
  // Placement denied
  export const DENY_EVENT = `${PREFIX}placement_deny`;

  // Updates between the server and the client:

  // The building has been collected on the client
  export const COLLECTED_EVENT = `${PREFIX}collected`;
  export const ACCEPT_COLLECT_EVENT = `${PREFIX}collect_accepted`;
  export const DENY_COLLECT_EVENT = `${PREFIX}collect_denied`;

  export type DbBuilding = BuildingTypes.DbBuildingInfo;
  // The client building misses the _id and lastProdTime properties
  export interface ClientBuilding {
    // The name of the building used to identify it in the building types
    buildingType: BuildingTypes.BuildNames;
    // The tile position of this building
    position: BuildingTypes.TilePosition;
  }
  // When the placement gets approved, resource status is updated
  // Also, we need to identify the subject, i.e. the building, by its unique position
  export interface ResourcesAfterPlacement extends BuildingTypes.Resources {
    // Send the db id
    _id: string;
    buildingPosition: BuildingTypes.TilePosition;
  }

  // After the user tries to collect some resources, send the result
  export interface ResourcesAfterCollect extends BuildingTypes.Resources {
    // Send the db id
    _id: string;
    // Also send the lastProdTime so there are no clocks desynchronizations
    lastProdTime: number;
  }

  // The acknowledge callback that responds to a collect event
  export type CollectAck = (
    respEvent: string,
    res: ResourcesAfterCollect
  ) => void;
}

export namespace Characters {
  const PREFIX = "Characters.";

  export const NEW_CHARA_EVENT = `${PREFIX}new_chara`;
  export const SEND_CHARAS_EVENT = `${PREFIX}send_charas`;
  export const UPDATE_CHARA_EVENT = `${PREFIX}update_chara`;

  export type DbCharacter = CharacterDbInfo;
  export type CharaPosition = Position;
}
