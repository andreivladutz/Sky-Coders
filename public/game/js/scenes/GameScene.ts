import CST from "../CST";
import { ISOMETRIC } from "../IsoPlugin/IsoPlugin";
import IsoScene from "../IsoPlugin/IsoScene";

import CameraManager from "../managers/CameraManager";
import MapManager from "../managers/MapManager";
import BuildingsManager from "../managers/BuildingsManager";
import ActorsManager from "../managers/ActorsManager";

export default class GameScene extends IsoScene {
  constructor() {
    const config = {
      key: CST.SCENES.GAME
    };

    super(config);

    // set the isometric projection to be true isometric
    this.isometricType = ISOMETRIC;
  }

  preload() {
    super.preload(CST.PLUGINS.ISO.FILE_IDENTIFIER);
  }

  init() {
    /*
    let isFullscreenSupported = this.sys.game.device.fullscreen.available;

    if (isFullscreenSupported) {
      this.input.on("pointerup", () => {
        this.game.scale.toggleFullscreen();
      });
    }
    */

    // start the UI scene and move it above
    this.scene.launch(CST.SCENES.UI);
  }

  create() {
    // Set the projector's world origin
    this.iso.projector.origin.setTo(
      CST.PROJECTOR.ORIGIN.X,
      CST.PROJECTOR.ORIGIN.Y
    );

    // fire the map init
    MapManager.getInstance().initMap(this);

    // init the camera controller
    CameraManager.getInstance({
      camera: this.cameras.main,
      scene: this,
      enablePan: true,
      enableZoom: true
    });

    // Place the buildings from the server
    BuildingsManager.getInstance().initBuildings(this);

    let actorsManager = ActorsManager.getInstance();
    // Place the actors from the server
    actorsManager.initCharacters(this);

    // Pick a random actor and focus the camera on him
    Phaser.Math.RND.pick(actorsManager.sceneActors).centerCameraOn();

    // MapManager.getInstance()
    //   .enableDebugging()
    // actor.enableDebugging();
  }

  update() {
    //
  }
}
