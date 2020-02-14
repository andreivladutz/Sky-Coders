import CONSTANTS from "../CST";

export default class LoadingScene extends Phaser.Scene {
  graphics: Phaser.GameObjects.Graphics;

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

    this.load.setPrefix("GROUND_TILES.");
    this.load.setPath("image/");
    this.load.image("floor", "floor.png");
    this.load.image("wall", "cube.png");
  }

  onLoaderProgress(progress) {
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
