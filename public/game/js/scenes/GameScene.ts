import CST from "../CST";
import { IsoSprite, ISOMETRIC } from "../IsoPlugin/IsoPlugin";
import IsoScene from "../IsoPlugin/IsoScene";

import CameraController from "../controllers/CameraController";
import MapController from "../controllers/MapController";
import Actor from "../controllers/Actor";
import { ACTOR_NAMES, ACTOR_DIRECTIONS } from "../ACTORS_CST";
import TileMap from "../IsoPlugin/TileMap";

// TODO: remove global variables
let cursors, speed, actor;

export default class GameScene extends IsoScene {
  tileMap: TileMap;
  // class helpers
  cameraControl: CameraController;

  constructor() {
    const config = {
      key: CST.SCENES.GAME
    };
    // TODO: deactivate physics if not used anymore
    // also enable physics
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
    this.tileMap = MapController.getInstance().initMap(this);
    // init the camera controller
    this.cameraControl = new CameraController(this.cameras.main, this, {
      enablePan: true,
      enableZoom: true
    });

    actor = new Actor({
      actorKey: ACTOR_NAMES.MALLACK,
      x: 2000,
      y: 2000,
      z: 0,
      scene: this,
      frame: "Mallack/se/mallack00016"
    });

    cursors = this.input.keyboard.createCursorKeys();
    speed = 2000;

    actor.walkAnim(ACTOR_DIRECTIONS.SOUTH);

    this.isoPhysics.world.enable(actor.isoSprite);
  }

  update() {
    if (cursors.left.isDown) {
      actor.isoSprite.body.velocity.x = -speed;
    } else if (cursors.right.isDown) {
      actor.isoSprite.body.velocity.x = speed;
    } else {
      actor.isoSprite.body.velocity.x = 0;
    }

    if (cursors.up.isDown) {
      actor.isoSprite.body.velocity.y = -speed;
    } else if (cursors.down.isDown) {
      actor.isoSprite.body.velocity.y = speed;
    } else {
      actor.isoSprite.body.velocity.y = 0;
    }

    this.tileMap.drawTilesDebug();
    this.tileMap.isoDebug.debugIsoSprites([actor.isoSprite], 0xeb4034, false);
  }
}
