export enum ACTOR_NAMES {
  MALLACK = "Mallack"
}

export const ACTOR_NAMES_ARR = [ACTOR_NAMES.MALLACK];

export interface Position {
  x: number;
  y: number;
}

// What details about a character are being stored in the db
export interface CharacterDbInfo {
  actorKey: ACTOR_NAMES;
  // The id of the character in the db array
  _id: any;
  // The tile positioning
  position?: Position;
  // The blockly xml worskpace state
  workspaceBlockly: string;
}
