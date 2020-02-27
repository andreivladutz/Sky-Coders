import Phaser from "phaser";

import CONSTANTS from "./CST";

import LoadingScene from "./scenes/LoadingScene";
import GameScene from "./scenes/GameScene";
// enable await loader
import AwaitLoaderPlugin from "phaser3-rex-plugins/plugins/awaitloader-plugin.js";

// set the canvas to be fullscreen, centered and set the parent to the container div
const scaleConfig: Phaser.Types.Core.ScaleConfig = {
  width: "100%",
  height: "100%",
  parent: "canvas-container",
  expandParent: true,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  mode: Phaser.Scale.ScaleModes.RESIZE,
  fullscreenTarget: "canvas-container"
};

const gameConfig: Phaser.Types.Core.GameConfig = {
  // choose between WebGL and canvas automatically
  type: Phaser.AUTO,
  // the width and height will be changed by the scale manager
  width: CONSTANTS.GAME.WIDTH,
  height: CONSTANTS.GAME.HEIGHT,
  // title and version
  title: CONSTANTS.GAME.TITLE,
  version: CONSTANTS.GAME.VERSION,
  // the scenes array
  scene: [LoadingScene, GameScene],
  // prevent right mouse click default behaviour
  disableContextMenu: true,
  scale: scaleConfig,
  // render: {
  //   pixelArt: true
  // },
  physics: {
    default: "arcade"
  },
  plugins: {
    global: [
      {
        key: "rexAwaitLoader",
        plugin: AwaitLoaderPlugin,
        start: true
      }
    ]
  }
};

new Phaser.Game(gameConfig);
