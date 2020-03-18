import WORKER_CST from "./utils/astar/WORKER_CST";

//TODO: Change variant
const VARIANT = "-hd";

export default {
  GAME: {
    WIDTH: 1920,
    HEIGHT: 1080,
    TITLE: "HTML5 Multiplayer Isometric Game",
    VERSION: "0.1"
  },
  // scene keys
  SCENES: {
    LOAD: "LOAD",
    GAME: "GAME",
    UI: "UISCENE"
  },
  // terrain generation parameters
  MAP: {
    WIDTH: 128,
    HEIGHT: 128,
    DEFAULT_CFG: {
      frequency: 0.025,
      exponent: 1
    },
    // maximum value when discretizing the noise map
    HEIGHT_MAP_MAX: 0.85
  },
  PLUGINS: {
    ISO: {
      FILE_IDENTIFIER: "IsoPlugin",
      SCENE_KEY: "iso"
    }
  },
  // camera controller params
  CAMERA: {
    MAX_ZOOM: 3,
    MIN_ZOOM: 0.1,
    PAN_THRESHOLD: 10,
    // smoother camera drag
    PAN_LERP: 0.8,
    // how much zoom do you get when you scroll your mouse
    ZOOM_FACTOR: 0.8,
    MOVE_EVENT: "camera.moved",
    ZOOM_EVENT: "camera.zoomed",
    // how many tiles around the view area to add when computing which tiles are visible
    VIEWRECT_TILE_PAD: 10
  },
  // options for the board grid
  GRID: {
    // 2 px for the line width
    LINE_WIDTH: 2,
    LINE_COLOR: 0xffffff,
    LINE_ALPHA: 1,
    // if the game is zoomed out too much, the grid will hide
    ZOOM_DEACTIVATE: 0.2,
    // the grid should be drawn on top of the tile layer
    GRID_DEPTH: 2,
    // fill alpha for game objects' grid
    FILL_ALPHA: 0.3
  },
  TILEMAP: {
    OFFSCR_BUFF_KEY: "tileMapOffscreenCanvas",
    OFFSCR_BUFF_ID: "offscren-buffer"
  },
  // service-worker related csts
  SW: {
    BUILT_SW_PATH: "./sw-build.js"
  },
  ENVIRONMENT: {
    // the prefix added to Phaser's frames
    TEXTURE_PREFIX: "ENV.",
    // the key of the atlas resource
    ATLAS_KEY: "ENVIRONMENT.ATLAS_KEY",
    // path to multiatlas
    MULTIATLAS_PATH: "sprite/environment/",
    MULTIATLAS: `environment${VARIANT}.json`,
    GRASS: {
      PREFIX: "Tiles/grass",
      BASE_PREFIX: "Tiles/base",
      START: 0,
      END: 5,
      ZERO_PAD: 2,
      // probability that a grass tile appears instead of a base one
      PROBABILITIES: [1 / 100, 1 / 20, 0, 1 / 300, 1 / 300]
    },
    TREES: {
      PREFIX: "Trees/",
      TREE_NAMES: ["PineTree", "Tree", "Tree1", "Tree2"]
    },
    // the empty tile's index
    EMPTY_TILE: 0,
    EMPTY_TILE_RATIO: 0.3,
    // how many of each
    GRASS_TILES_COUNT: 5,
    TREES_COUNT: 4,
    // offsets of tiles in the tilemap
    // e.g. map grass indices 1, 2,..,5 to 0,...,4
    BASE_OFFSET: 1,
    GRASS_OFFSET: 6
  },
  // CSTs for the PlacementManager
  REGIONS: {
    // the number of randomly picked regions in which we place game resources
    N_REG: 8,
    // how wide a region should be in tiles
    MAXSIZE: 30,
    // how many trees should be inside a region
    MAXTREES: 30,
    MINTREES: 4,
    // how many tiles should be around the trees
    TREE_RADIUS: 1
  },
  ACTOR: {
    SELECTION_TINT: 0xd0f5e9
  },
  NAV_OBJECT: {
    SPEED: 400,
    EVENTS: {
      WALKING: {
        S: "walking.S",
        SE: "walking.SE",
        SW: "walking.SW",
        N: "walking.N",
        NE: "walking.NE",
        NW: "walking.NW",
        E: "walking.E",
        W: "walking.W"
      },
      IDLE: "idle"
    }
  },
  COLORS: {
    WHITE: 0xffffff,
    RED: 0xff0000,
    GREEN: 0x00ff00
  },
  EVENTS: {
    MAP: {
      TAP: "tiletap",
      MOVE: "tilemove",
      PRESS: "tilepressstart"
    },
    OBJECT: {
      SELECT: "object.select",
      DESELECT: "object.deselect"
    }
  },
  // constants imported from the worker cst
  WORKER: WORKER_CST
};
