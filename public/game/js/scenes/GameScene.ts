import CST from "../CST";
import { IsoSprite, ISOMETRIC, Point3 } from "../IsoPlugin/IsoPlugin";
import IsoScene from "../IsoPlugin/IsoScene";

import CameraManager from "../managers/CameraManager";
import MapManager from "../managers/MapManager";
import Actor from "../managers/Actor";
import { ACTOR_NAMES, ACTOR_DIRECTIONS } from "../ACTORS_CST";
import TileMap from "../IsoPlugin/TileMap";
import IsoGameObject from "../managers/IsoSpriteObject";

// TODO: remove global variables
let actor: Actor;

export default class GameScene extends IsoScene {
  tileMap: TileMap;

  constructor() {
    const config = {
      key: CST.SCENES.GAME
    };
    // TODO: deactivate physics if not used anymore
    super(config, true);

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
    this.iso.projector.origin.setTo(0.5, 0.2);

    // fire the map init
    this.tileMap = MapManager.getInstance().initMap(this);
    // init the camera controller
    CameraManager.getInstance({
      camera: this.cameras.main,
      scene: this,
      enablePan: true,
      enableZoom: true
    });

    actor = new Actor({
      actorKey: ACTOR_NAMES.MALLACK,
      tileX: 33,
      tileY: 20,
      z: 0,
      scene: this
    });

    actor.idleAnim(ACTOR_DIRECTIONS.SE);

    MapManager.getInstance()
      .enableDebugging()
      .setScrollOverTiles(actor.tileX, actor.tileY);
    actor.enableDebugging();
  }

  update() {
    // code to follow an actor
    // MapManager.getInstance().setScrollOverTiles(
    //   actor.gameObject.floatingTileX,
    //   actor.gameObject.floatingTileY
    // );
  }
}
