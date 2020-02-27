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
    GAME: "GAME"
  },
  // terrain generation parameters
  MAP: {
    WIDTH: 128,
    HEIGHT: 128,
    DEFAULT_CFG: {
      frequency: 0.025,
      exponent: 1
    }
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
    // time in milliseconds to debounce. not emitting the move event for this time
    MOVE_EVENT_DEBOUNCE: 50,
    // how many tiles around the view area to add when computing which tiles are visible
    VIEWRECT_TILE_PAD: 50
  },
  // options for the board grid
  GRID: {
    // 1 px for the line width
    LINE_WIDTH: 1,
    LINE_COLOR: 0xffffff,
    LINE_ALPHA: 1,
    BUFFER: {
      // how much the grid buffer will be scaled in proportion to the real game size
      SCALE: 15
    }
  }
};
