// import the scenes
import LoadingScene from "../scenes/LoadingScene";
import GameScene from "../scenes/GameScene";
import UIScene from "../scenes/UIScene";

// enable await loader and ui plugins from Rex
import AwaitLoaderPlugin from "phaser3-rex-plugins/plugins/awaitloader-plugin.js";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";

import CST from "../CST";

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

const pluginsConfig: Phaser.Types.Core.PluginObject = {
  global: [
    {
      key: "rexAwaitLoader",
      plugin: AwaitLoaderPlugin,
      start: true
    }
  ],
  scene: [
    {
      sceneKey: CST.SCENES.UI,
      key: "rexUI",
      plugin: UIPlugin,
      mapping: "rexUI"
    }
  ]
};

const gameConfig: Phaser.Types.Core.GameConfig = {
  // choose between WebGL and canvas automatically
  type: Phaser.AUTO,
  // the width and height will be changed by the scale manager
  width: CST.GAME.WIDTH,
  height: CST.GAME.HEIGHT,
  // title and version
  title: CST.GAME.TITLE,
  version: CST.GAME.VERSION,
  // the scenes array
  scene: [LoadingScene, GameScene, UIScene],
  // prevent right mouse click default behaviour
  disableContextMenu: true,
  scale: scaleConfig,
  // render: {
  //   pixelArt: true
  // },
  physics: {
    default: "arcade"
  },
  plugins: pluginsConfig
};

export default gameConfig;
