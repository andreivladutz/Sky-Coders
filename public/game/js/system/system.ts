// Static values determined at runtime
const SYSTEM = {
  VARIANT: `-${getVariant()}`,
  SCREEN_WIDTH: screenPixelWidth(),
  SCREEN_HEIGHT: screenPixelHeight(),
  // TOUCH_ENABLED, WORKER_SUPPORT added when a phaser game is inited
  TOUCH_ENABLED: false,
  WORKER_SUPPORT: false
};

export default SYSTEM;

function getVariant() {
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

function screenPixelWidth() {
  return window.screen.width * window.devicePixelRatio;
}

function screenPixelHeight() {
  return window.screen.height * window.devicePixelRatio;
}
