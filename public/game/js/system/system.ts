// Static values determined at runtime
const SYSTEM = {
  get VARIANT() {
    return `-${getVariant()}`;
  },
  SCREEN_WIDTH: screenPixelWidth(),
  SCREEN_HEIGHT: screenPixelHeight(),
  PIXEL_RATIO: deviceRatio(),
  // TOUCH_ENABLED, WORKER_SUPPORT added when a phaser game is inited in the loading scene
  TOUCH_ENABLED: false,
  WORKER_SUPPORT: false,
};

export default SYSTEM;

function getVariant() {
  // Just hardcode the lowest resolution settings for touch enabled devices which
  // We interpret as being mobile
  if (SYSTEM.TOUCH_ENABLED) {
    return "sd";
  }

  // Watch out for mobile devices in portrait mode
  let screenHeight = Math.min(screenPixelHeight(), screenPixelWidth());

  // Somewhere below 720p
  if (screenHeight < 720) {
    return "sd";
  }
  // Somewhere between 720p and 1440p
  else if (screenHeight >= 720 && screenHeight < 1440) {
    return "md";
  }
  // Anything above 1080p
  else {
    return "hd";
  }
}

function deviceRatio() {
  return window.devicePixelRatio;
}

function screenPixelWidth() {
  return window.screen.width * window.devicePixelRatio;
}

function screenPixelHeight() {
  return window.screen.height * window.devicePixelRatio;
}
