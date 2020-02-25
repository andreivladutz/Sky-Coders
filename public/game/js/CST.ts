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
      frequency: 1,
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
    ZOOM_FACTOR: 0.8
  }
};
