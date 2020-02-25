import CST from "../CST";
import { IsoSprite, ISOMETRIC } from "../IsoPlugin/IsoPlugin";
import { IsoDebugger } from "../utils/debug";
import IsoScene from "../IsoPlugin/IsoScene";

import TerrainGenerator from "../terrain/terrainGenerator";
import CameraController from "../controllers/CameraController";
import Actor from "../controllers/Actor";
import { ACTOR_NAMES, ACTOR_DIRECTIONS } from "../ACTORS_CST";

const TILE_WIDTH = 256 - 2,
  TILE_HEIGHT = 148;

let groundTiles: number[][];

interface DynamicIsoSprite extends IsoSprite {
  [key: string]: any;
}

let cursors, speed, actor;

export default class GameScene extends IsoScene {
  groundLayerGroup: Phaser.GameObjects.Group;
  isoDebug: IsoDebugger;

  // class helpers
  terrainGen: TerrainGenerator;
  cameraControl: CameraController;

  constructor() {
    const config = {
      key: CST.SCENES.GAME
    };
    // also enable physics
    super(config, true);

    // set the isometric projection to be true isometric
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
  }

  create() {
    this.cameraControl = new CameraController(this.cameras.main, this, {
      enablePan: true,
      enableZoom: true
    });

    this.groundLayerGroup = this.add.group();
    this.iso.projector.origin.setTo(0.5, 0.2);

    groundTiles = this.terrainGen.generateIslandTerrain([0, 1, 1]);

    this.isoDebug = new IsoDebugger(this, this.iso)
      .enableDebugging()
      .debugCoords();

    // this.cameras.main.scrollX += 100;

    this.generateGroundLayer();

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

    // this.isoDebug.debugIsoSprites(
    //   this.groundLayerGroup.getChildren() as Array<IsoSprite>,
    //   0xeb4034,
    //   false
    // );

    // @ts-ignore
    this.isoDebug.debugIsoSprites([actor.isoSprite], 0xeb4034, false);
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
