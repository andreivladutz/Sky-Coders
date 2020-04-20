import WORKER_CST from "./utils/astar/WORKER_CST";

//TODO: Change variant
const VARIANT = "-hd";

const BUTTON_TYPES = {
  BUILD: "Build",
  LEADERBOARD: "Leaderboard",
  LOGOUT: "Logout",
  SCRIPT: "Script",
  SETTINGS: "Settings",
  SOUND: "Sound",
  WOOD_BG: "wood_texture",
  WOOD_PLANK: "wood_plank",
  CANCEL: "Cancel",
  OK: "Ok"
};

export interface MultiatlasConfig {
  // the key of the atlas resource
  ATLAS_KEY: string;
  // path to multiatlas
  MULTIATLAS_PATH: string;
  // multiatlas filename
  MULTIATLAS: string;
  // the prefix of the frames prepended by TexturePacker
  PREFIX: string;
  // multiple types of frames that will be indexed
  // by the names provided here as property values
  TYPES: {
    [constant_id: string]: string;
  };
}

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
  // the isoScene projector found in the game and the UI scenes
  PROJECTOR: {
    ORIGIN: {
      X: 0.5,
      Y: 0.2
    }
  },
  // camera controller params
  CAMERA: {
    MAX_ZOOM: 1,
    MIN_ZOOM: 0.1,
    PAN_THRESHOLD: 10,
    // smoother camera drag
    PAN_LERP: 0.8,
    // how much zoom do you get when you scroll your mouse
    ZOOM_FACTOR: 0.8,
    MOVE_EVENT: "camera.moved",
    ZOOM_EVENT: "camera.zoomed",
    // how many tiles around the view area to add when computing which tiles are visible
    VIEWRECT_TILE_PAD: 10,
    // don t let the user scroll outside of the map
    PANLIMIT_RATIO: 4
  },
  // options for the board grid
  GRID: {
    // 2 px for the line width
    LINE_WIDTH: 5,
    LINE_COLOR: 0xffffff,
    LINE_ALPHA: 1,
    // if the game is zoomed out too much, the grid will hide
    ZOOM_DEACTIVATE: 0.2,
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
    CLIFFS: {
      PREFIX: "Cliffs/",
      CLIFF_NAMES: ["cliff1", "cliff2", "cliff3"]
    },
    ORES: {
      PREFIX: "Ores/",
      ORES_NAMES: ["black_ore", "crystal"]
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
  BUILDINGS: {
    // the key of the atlas resource
    ATLAS_KEY: "BUILDINGS.ATLAS_KEY",
    // path to multiatlas
    MULTIATLAS_PATH: "sprite/buildings/",
    MULTIATLAS: `buildings${VARIANT}.json`,
    // the prefix of all buildings' frames
    PREFIX: "Buildings/",
    TYPES: {
      RESIDENTIAL: "residential"
    }
  },
  BUTTONS: {
    // the key of the atlas resource
    ATLAS_KEY: "BUTTONS.ATLAS_KEY",
    // path to multiatlas
    MULTIATLAS_PATH: "sprite/ui/",
    MULTIATLAS: `main_buttons${VARIANT}.json`,
    // the prefix of all buttons' frames
    PREFIX: "Buttons/",
    // the types of the buttons
    TYPES: BUTTON_TYPES
  },
  // CSTs for the PlacementManager
  REGIONS: {
    // the number of randomly picked regions in which we place game resources
    N_REG: 8,
    // how wide a region should be in tiles
    MAXSIZE: 30,
    // how many trees should be inside a region
    MAXTREES: 30,
    MINTREES: 8,
    // how many tiles should be around the trees
    TREE_RADIUS: 1,
    ORE_RADIUS: 5
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
    GREEN: 0x00ff00,
    YELLOW: 0xffff00,
    LIME: 0xd5ff00,
    MAROON: 0x4e342e,
    LIGHT_MAROON: 0x7b5e57,
    DARK_MAROON: 0x260e04
  },
  EVENTS: {
    MAP: {
      TAP: "tiletap",
      MOVE: "tilemove",
      PRESS: "tilepressstart",
      PREVENTING: "startedpreventingevents"
    },
    OBJECT: {
      SELECT: "object.select",
      DESELECT: "object.deselect"
    },
    ARROWS_UI: {
      TAP: "arrow.tapped"
    },
    LOAD_SCENE: {
      LOAD_COMPLETE: "loadcomplete"
    }
  },
  // layer depth for different rendering "objects"
  LAYER_DEPTH: {
    CLIFFS: 0,
    TILES: 1,
    WORLD_GRID: 2,
    OBJECT_GRID: 3,
    UI: Infinity
  },
  // CONSTANTS FOR THE LAYER MANAGER
  LAYERS: {
    // ids for the game objects. they do not need a layer because they compute their own depth
    OBJ_ID: {
      TREE: 4,
      ORE: 5,
      BUILDING: 6
    },
    ACTOR_ID: 100,
    // Represent the map grid efficiently using only 8 bits per tile
    // first two bits represent if the tile should be flipped on the x and y axis
    MASK: {
      FLIPX_BIT: 7,
      FLIPY_BIT: 6,
      TILE_ID_MASK: 63
    }
  },
  ARROW_SHAPE: {
    BASEW: 100,
    BASEH: 150,
    HEADW: 100,
    ARROWH: 300,
    NORTH: 0,
    EAST: Math.PI / 2,
    SOUTH: Math.PI,
    WEST: (3 * Math.PI) / 2,
    Z_EFFECT: 40
  },
  UI: {
    BUTTONS: {
      TINT_COLOR: 0xffe4b5
    },
    BUILD_PLACE: {
      // arrow offset from the building
      ARROW_OFFSET: 1.5
    },
    CONFIRM_BUTTONS: {
      ANCHOR: {
        top: "top",
        left: "center"
      },
      ORIENTATION: "x",
      SPACE: 5,
      ALIGN: "center",
      SCALE: 0.7
    },
    MAIN_BUTTONS: {
      // position
      BG_ANCHOR: {
        bottom: "bottom",
        left: "left+10"
      },
      BTNS_ROWS: 2,
      BTNS_COLS: 3,
      BUTTON_IMGS: [
        BUTTON_TYPES.BUILD,
        BUTTON_TYPES.SCRIPT,
        BUTTON_TYPES.LEADERBOARD,
        BUTTON_TYPES.SETTINGS,
        BUTTON_TYPES.SOUND,
        BUTTON_TYPES.LOGOUT
      ],
      BTN_SCALE: 0.7,
      BG_SCALE_Y: 0.9,
      TILED_DECORATION_SCALE_Y: 0.9,
      BG_IMG: BUTTON_TYPES.WOOD_BG,
      EXPAND_BTN: false,
      ALIGN_BTN: "center"
    },
    BUILD_MENU: {
      SIZER: {
        ORIENTATION: "y"
      },
      ANCHOR: {
        left: "left",
        top: "top"
      },
      // vertical scrolling
      SCROLL_MODE: 0,
      // shrink the real buildings to use them as buttons
      BUTTONS_SIZE: 0.1
    },
    DEPTH: {
      DECORATIONS: 0,
      BG: 1,
      BUTTONS: 2
    },
    // buttons transitioning in and out of screen
    MOVEMENT: {
      DURATION: 750,
      // moving inside and outside of the screen
      DEFAULT_DISTANCE: 200
    }
  },
  STATES: {
    MAIN_UI: "mainUIState",
    BUILD_MENU: "buildMenuState",
    BUILD_PLACING: "buildPlacingState"
  },
  // SOCKET.IO CONSTANTS
  IO: {
    EVENTS: {
      CONNECT: "connect",
      RECONNECT: "reconnect"
    }
  },
  // constants imported from the worker cst
  WORKER: WORKER_CST
};
