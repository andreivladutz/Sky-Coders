import CST from "../CST";
import SYSTEM from "../system/system";
import AwaitLoaderPlugin from "phaser3-rex-plugins/plugins/awaitloader-plugin.js";

// kick the load subscribing of these Managers
// TODO: find a neater way
import "../managers/ActorsManager";
import "../managers/MapManager";
import "../managers/EnvironmentManager";
import Manager from "../managers/Manager";
import EventEmitter = Phaser.Events.EventEmitter;

interface rexAwaitLoader extends Phaser.Loader.LoaderPlugin {
  rexAwait: AwaitLoaderPlugin;
}

export default class LoadingScene extends Phaser.Scene {
  graphics: Phaser.GameObjects.Graphics;
  load: rexAwaitLoader;
  events = new EventEmitter();

  constructor() {
    super({
      key: CST.SCENES.LOAD
    });
  }

  init() {
    this.load.on("progress", this.onLoaderProgress, this);
    this.load.on("complete", () => {
      this.scene.start(CST.SCENES.GAME);

      this.events.emit(
        CST.EVENTS.LOAD_SCENE.LOAD_COMPLETE,
        this.scene.get(CST.SCENES.GAME)
      );
    });

    this.game.scale.setGameSize(this.game.scale.width, this.game.scale.height);
    this.populateSystemValues();
  }

  preload() {
    this.load.setBaseURL("./game/assets/");

    this.load.rexAwait(async (succesCb: () => void) => {
      this.load.setPrefix();

      // wait for all the subscribed Manager subclasses' preload
      let preloadPromises = Manager.getSubscribedManagers().map(classConstr =>
        classConstr.getInstance().preload(this.load)
      );

      await Promise.all(preloadPromises);

      succesCb();
    });
  }

  private populateSystemValues() {
    SYSTEM.TOUCH_ENABLED = this.sys.game.device.input.touch;
    SYSTEM.WORKER_SUPPORT = this.sys.game.device.features.worker;
  }

  private onLoaderProgress(progress: number) {
    let width: number = Number(this.game.scale.width),
      height: number = Number(this.game.scale.height);

    const MARGIN_OFFSET = width * 0.1,
      BAR_HEIGHT = 0.06 * height,
      LINE_WIDTH = 2;

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
    }

    this.graphics
      .clear()
      .fillStyle(0x000000)
      .fillRect(
        MARGIN_OFFSET,
        height - BAR_HEIGHT * 2,
        width - MARGIN_OFFSET * 2 + LINE_WIDTH,
        BAR_HEIGHT
      )
      .strokeRect(
        MARGIN_OFFSET - LINE_WIDTH / 2,
        height - BAR_HEIGHT * 2 - LINE_WIDTH / 2,
        width - MARGIN_OFFSET * 2 + LINE_WIDTH,
        BAR_HEIGHT + LINE_WIDTH
      )
      .fillStyle(0x2ecc71)
      .fillRect(
        MARGIN_OFFSET,
        height - BAR_HEIGHT * 2,
        (width - MARGIN_OFFSET * 2) * progress,
        BAR_HEIGHT
      );
  }
}
