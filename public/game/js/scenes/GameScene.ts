import CST from "../CST";
import IsoPlugin, {
  IsoSprite,
  IsoSpriteBuilder,
  ISOMETRIC
} from "../IsoPlugin/IsoPlugin";
import { IsoDebugger } from "../utils/debug";
import TerrainGenerator from "../terrain/terrainGenerator";
import CameraController from "../controllers/cameraController";

const TILE_WIDTH = 256 - 2,
  TILE_HEIGHT = 148 - 2;

let groundTiles: number[][];

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

  // class helpers
  terrainGen: TerrainGenerator;
  cameraControl: CameraController;

  constructor() {
    const config = {
      key: CST.SCENES.GAME,
      // inject the "iso" key on the scene
      mapAdd: {
        isoPlugin: CST.PLUGINS.ISO.SCENE_KEY
      }
    };

    super(config);
    // set the isometric projection to true isometric
    this.isometricType = ISOMETRIC;

    this.terrainGen = TerrainGenerator.getInstance({
      seed: "nice",
      width: CST.MAP.WIDTH,
      height: CST.MAP.HEIGHT,
      frequency: 0.025
      // pass along for debugging the noise map
      //debug: true,
      //scene: this
    }); //.addMoreNoiseMaps([{ f: 0.01, w: 0.3 }]);
  }

  preload() {
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
    this.cameraControl = new CameraController(this.cameras.main, this, {
      enablePan: true,
      enableZoom: true
    });
    //this.cameras.main.setBounds(-Infinity, -Infinity, Infinity, Infinity);

    // this.cameras.main.setZoom(0.3);

    this.groundLayerGroup = this.add.group();
    this.iso.projector.origin.setTo(0.5, 0.2);

    groundTiles = this.terrainGen.generateIslandTerrain([0, 1, 1]);

    //this.terrainGen.getPrimaryIsle(groundTiles);

    this.isoDebug = new IsoDebugger(this, this.iso)
      //.enableDebugging()
      .debugCoords();

    // this.cameras.main.scrollX += 100;

    this.generateGroundLayer();
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
        let tile: DynamicIsoSprite;
        if (groundTiles[i][j] !== 1) {
          continue;
        }
        // @ts-ignore
        tile = groundTiles[i][j] = this.add
          .isoSprite(
            j * TILE_HEIGHT,
            i * TILE_HEIGHT,
            -145,
            "GROUND_TILES.floor",
            this.groundLayerGroup
          )
          .setScale(0.5, 0.5);

        tile.setOrigin(0.5, 0);

        tile.setInteractive().on("pointerover", () => {
          if (!tile.tinted) {
            tile.setTint(0x86bfda);
            //tile.isoZ += 5;

            tile.tinted = true;
          }
        });
        tile.setInteractive().on("pointerout", () => {
          if (tile.tinted) {
            tile.clearTint();
            //tile.isoZ -= 5;

            tile.tinted = false;
          }
        });

        // this.input.on("pointermove", pointer => {
        //   this.groundLayerGroup
        //     .getChildren()
        //     .forEach((tile: DynamicIsoSprite) => {
        //       let onTile = tile.containsScreenPoint(pointer);

        //       if (onTile) {
        //         if (!tile.tinted) {
        //           tile.setTint(0x86bfda);
        //           tile.isoZ += 5;

        //           tile.tinted = true;
        //           tile._depthBefore = tile.depth;
        //           tile.setDepth(Infinity);
        //         }
        //       } else if (tile.tinted) {
        //         tile.clearTint();
        //         tile.isoZ -= 5;

        //         tile.tinted = false;

        //         tile.setDepth();
        //       }
        //     });
        // });
      }
    }
  }
}
