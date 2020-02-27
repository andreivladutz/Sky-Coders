// just hardcoded for now
const VARIANT = "-hd";

export enum ACTOR_NAMES {
  MALLACK = "Mallack"
}

export enum ACTOR_STATES {
  WALK = "WALK",
  IDLE = "IDLE"
}

export enum ACTOR_DIRECTIONS {
  NORTH = "NORTH",
  SOUTH = "SOUTH",
  EAST = "EAST",
  WEST = "WEST",
  SE = "SE",
  SW = "SW",
  NE = "NE",
  NW = "NW"
}

export interface ActorAnimConfig {
  // the animation key identifier in the Phaser anims
  animationKey: string;
  start: number;
  end: number;
  zeroPad: number;
  // general prefix and suffix
  prefix: string;
  suffix: string;
  // prefix and suffix for each direction
  DIRECTIONS: {
    NORTH?: string;
    SOUTH?: string;
    EAST?: string;
    WEST?: string;
    SE?: string;
    SW?: string;
    NE?: string;
    NW?: string;
  };
}

// uniform config type
export interface ActorAtlasConfig {
  multiatlas: string;
  // configuration for Phaser's frame name generation
  anims: {
    [ACTOR_STATES.WALK]?: ActorAnimConfig;
    [ACTOR_STATES.IDLE]?: ActorAnimConfig;
  };
}

interface ActorsCST {
  basePath: string;
  resourcePrefix: string;
  frameRate: number;
  [ACTOR_NAMES.MALLACK]: ActorAtlasConfig;
}

// index by actors keys found in CST
let ACTORS_CST: ActorsCST = {
  // where the atlases are found
  basePath: "sprite/",
  // the prefix prepended to each actor resource's key
  resourcePrefix: "ACTORS.",
  // default frame rate of actors' animation
  frameRate: 30,
  // the actors configs indexed by name:
  [ACTOR_NAMES.MALLACK]: {
    multiatlas: `mallack${VARIANT}.json`,
    anims: {
      [ACTOR_STATES.WALK]: {
        animationKey: `${ACTOR_NAMES.MALLACK}.${ACTOR_STATES.WALK}`,
        start: 1,
        end: 33,
        zeroPad: 4,
        prefix: "Mallack/",
        suffix: "",
        DIRECTIONS: {
          NORTH: "north/mallack3",
          SOUTH: "south/mallack7",
          EAST: "east/mallack1",
          WEST: "west/mallack5",
          SE: "se/mallack0",
          SW: "sw/mallack6",
          NE: "ne/mallack2",
          NW: "nw/mallack4"
        }
      }
    }
  }
};

export default ACTORS_CST;