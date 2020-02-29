import CONSTANTS from "../CST";
import ActorsController from "../controllers/ActorsController";

import AwaitLoaderPlugin from "phaser3-rex-plugins/plugins/awaitloader-plugin.js";
import MapController from "../controllers/MapController";
import IsoScene from "../IsoPlugin/IsoScene";

interface rexAwaitLoader extends Phaser.Loader.LoaderPlugin {
  rexAwait: AwaitLoaderPlugin;
}

export default class LoadingScene extends Phaser.Scene {
  graphics: Phaser.GameObjects.Graphics;
  load: rexAwaitLoader;

  constructor() {
    super({
      key: CONSTANTS.SCENES.LOAD
    });
  }

  init() {
    this.load.on("progress", this.onLoaderProgress, this);
    this.load.on("complete", () => {
      this.scene.start(CONSTANTS.SCENES.GAME);
    });

    this.game.scale.setGameSize(this.game.scale.width, this.game.scale.height);
  }

  preload() {
    this.load.setBaseURL("./game/assets/");

    // load the resources for the actors
    ActorsController.getInstance().loadResources(this.load);

    this.load.setPrefix("GROUND_TILES.");
    this.load.setPath("image/");
    this.load.image("floor", "tile.png");

    this.load.rexAwait((succesCb: () => void) => {
      // fire the terrain generation
      MapController.getInstance().preloadInit();

      succesCb();
    });
  }

  onLoaderProgress(progress: number) {
    const MARGIN_OFFSET = 20,
      BAR_HEIGHT = 40,
      LINE_WIDTH = 2;
    let width: number = Number(this.game.scale.width),
      height: number = Number(this.game.scale.height);

    if (!this.graphics) {
      this.graphics = this.add.graphics({
        fillStyle: {
          color: 0x2ecc71
        },
        lineStyle: {
          width: LINE_WIDTH,
          color: 0xffffff
        }
      });
      this.graphics.strokeRect(
        MARGIN_OFFSET - LINE_WIDTH / 2,
        height / 2 - LINE_WIDTH / 2,
        width - MARGIN_OFFSET * 2 + LINE_WIDTH,
        BAR_HEIGHT + LINE_WIDTH
      );
    }

    this.graphics.fillRect(
      MARGIN_OFFSET,
      height / 2,
      (width - MARGIN_OFFSET * 2) * progress,
      BAR_HEIGHT
    );
  }
}
