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
    resources: BuildingTypes.Resources;
    // The buildings already placed by the user on the map
    buildings: BuildingTypes.DbBuildingInfo[];
  }

  export type Resources = BuildingTypes.Resources;

  export const INIT_EVENT = `${PREFIX}game_init`;
  export const LOAD_EVENT = `${PREFIX}game_loaded`;
}

export namespace BuildingPlacement {
  const PREFIX = "Building.";

  // Request the placement of a building to the server
  export const REQUEST_EVENT = `${PREFIX}building_placed`;
  // Placement approved
  export const APPROVE_EVENT = `${PREFIX}placement_approved`;
  // Placement denied
  export const DENY_EVENT = `${PREFIX}placement_deny`;

  export type DbBuilding = BuildingTypes.DbBuildingInfo;
  // When the placement gets approved, resource status is updated
  // Also, we need to identify the subject, i.e. the building, by its unique position
  export interface ResourcesAfterPlacement extends BuildingTypes.Resources {
    buildingPosition: BuildingTypes.TilePosition;
  }
}

export namespace Characters {
  const PREFIX = "Characters.";

  export const NEW_CHARA_EVENT = `${PREFIX}new_chara`;
  export const SEND_CHARAS_EVENT = `${PREFIX}send_charas`;
  export const UPDATE_CHARA_EVENT = `${PREFIX}update_chara`;

  export type DbCharacter = CharacterDbInfo;
  export type CharaPosition = Position;
}
