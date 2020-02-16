import CST from "../CST";
import IsoPlugin, { IsoSprite, IsoSpriteBuilder } from "../IsoPlugin/IsoPlugin";
import { IsoDebugger } from "../utils/debug";

const WALL = 1;
const FLOOR = 0;

const groundTiles = [
  [1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1]
];

const TILE_WIDTH = 103,
  TILE_HEIGHT = 53;

interface DynamicIsoSprite extends IsoSprite {
  [key: string]: any;
}

// tell typescript that the isometric plugin is going to inject the isoSprite property on the GameObjectFactory
interface GameObjectFactoryIso extends Phaser.GameObjects.GameObjectFactory {
  isoSprite?: IsoSpriteBuilder;
}

export default class GameScene extends Phaser.Scene {
  groundLayerGroup: Phaser.GameObjects.Group;
  // these properties will be changed by injecting the isometric plugin
  iso: IsoPlugin;
  add: GameObjectFactoryIso;
  // the projection angle
  isometricType: number;
  isoDebug: IsoDebugger;

  constructor() {
    const config = {
      key: CST.SCENES.GAME,
      // inject the "iso" key on the scene
      mapAdd: {
        isoPlugin: CST.PLUGINS.ISO.SCENE_KEY
      }
    };

    super(config);

    //this.isometricType = ISOMETRIC;
  }

  preload() {
    this.load.image("tile", "./game/assets/image/tile.png");

    // load the isometric plugin
    this.load.scenePlugin({
      key: CST.PLUGINS.ISO.FILE_IDENTIFIER,
      url: IsoPlugin,
      sceneKey: CST.PLUGINS.ISO.SCENE_KEY
    });
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
  }

  create() {
    this.groundLayerGroup = this.add.group();
    this.iso.projector.origin.setTo(0.5, 0.3);

    this.isoDebug = new IsoDebugger(this, this.iso).debugCoords();
    //this.cameras.main.scrollX += 100;

    //this.generateGroundLayer();
    this.spawnTiles();
  }

  spawnTiles() {
    let index = 1;
    for (var xx = 0; xx < 256; xx += 40) {
      for (var yy = 0; yy < 256; yy += 40) {
        let tile: DynamicIsoSprite = this.add
          .isoSprite(xx * 2, yy * 2, 0, "tile", this.groundLayerGroup)
          .setOrigin(0.5, 0)
          .setScale(2, 2);

        this.add
          .text(tile.x, tile.y, String(index++))
          .setDepth(Infinity)
          .setColor("red");

        // tile.setInteractive().on("pointerover", () => {
        //   if (!tile.tinted) {
        //     tile.setTint(0x86bfda);
        //     tile.isoZ += 5;

        //     tile.tinted = true;
        //   }
        // });
        // tile.setInteractive().on("pointerout", () => {
        //   if (tile.tinted) {
        //     tile.clearTint();
        //     tile.isoZ -= 5;

        //     tile.tinted = false;
        //   }
        // });
      }
    }

    this.input.on("pointermove", pointer => {
      this.groundLayerGroup.getChildren().forEach((tile: DynamicIsoSprite) => {
        let onTile = tile.containsScreenPoint(pointer);

        if (onTile) {
          if (!tile.tinted) {
            tile.setTint(0x86bfda);
            tile.isoZ += 5;

            tile.tinted = true;
          }
        } else if (tile.tinted) {
          tile.clearTint();
          tile.isoZ -= 5;

          tile.tinted = false;
        }
      });
    });
  }

  update() {
    this.isoDebug.debugIsoSprites(
      this.groundLayerGroup.getChildren() as Array<IsoSprite>,
      0xeb4034,
      false
    );
  }

  generateGroundLayer() {
    for (let i = 0; i < groundTiles.length; i++) {
      for (let j = 0; j < groundTiles[i].length; j++) {
        switch (groundTiles[i][j]) {
          case FLOOR:
            // @ts-ignore
            this.add.isoSprite(
              (j * TILE_WIDTH) / 2,
              i * TILE_HEIGHT,
              -25,
              "GROUND_TILES.floor",
              this.groundLayerGroup
            );

            break;
          case WALL:
            // @ts-ignore
            this.add.isoSprite(
              (j * TILE_WIDTH) / 2,
              i * TILE_HEIGHT,
              0,
              "GROUND_TILES.wall",
              this.groundLayerGroup
            );
        }
      }
    }
  }
}
