import Phaser from "phaser";

import Manager from "./Manager";
import CST from "../CST";

import PlacementManager from "./PlacementManager";
import IsoScene from "../IsoPlugin/IsoScene";
import BboxKDStorage from "../utils/dataTypes/BboxKDStorage";
import IsoSpriteObject from "../gameObjects/IsoSpriteObject";
import MapManager from "./MapManager";

type Frame = Phaser.Types.Animations.AnimationFrame;
type FrameGen = Phaser.Types.Animations.GenerateFrameNames;

// for every type of grass tile we have a base tile and a grass tile with decorations
// each decoration has a probability of showing up
export interface GrassTileConfig {
  baseTile: number;
  grassTile: number;
  // the probability to choose the grass tile over the base tile
  decorationProbability: number;
}

export default class EnvironmentManager extends Manager {
  public treesFrames: string[];
  public grassFrames: string[];
  public baseFrames: string[];
  // The frames of the cliff margins
  public cliffFrames: string[];
  // The frames of the various ores found in the game
  public oreFrames: string[];

  // CONSTANTS:
  public readonly GRASS_TILES_COUNT = CST.ENVIRONMENT.GRASS_TILES_COUNT;
  public readonly TREES_COUNT = CST.ENVIRONMENT.TREES_COUNT;

  public readonly GRASS_OFFSET = CST.ENVIRONMENT.GRASS_OFFSET;
  public readonly BASE_OFFSET = CST.ENVIRONMENT.BASE_OFFSET;

  public TILE_WIDTH: number;
  public TILE_HEIGHT: number;

  // TODO: Keeping the indexing methods to check if these actually become useful later in the game
  // Trees and ores indexed efficiently in a kd-tree so they can be
  // Retrieved fast when they are in view range
  /* environmentObjStorage: BboxKDStorage<IsoSpriteObject>;*/

  // Index the objects currently in view by their tile coordinates
  // No objects are overlayed so this is safe
  /*environmentObjInView: Map<number, Map<number, IsoSpriteObject>> = new Map();*/

  // Keep this flag so listeners do not get registered multiple times
  /*initedListeners: boolean = false;*/

  // placementManager: PlacementManager;

  protected constructor() {
    super();
  }

  getTextureKey() {
    return CST.ENVIRONMENT.ATLAS_KEY;
  }

  // get the array of tile configs used for terrain generation
  getTilesIndicesConfigs(): GrassTileConfig[] {
    // the array of indices for grass tiles [1,..,8]
    return Array.from(
      { length: this.GRASS_TILES_COUNT },
      (_, idx: number): GrassTileConfig => ({
        baseTile: idx + this.BASE_OFFSET,
        grassTile: idx + this.GRASS_OFFSET,
        decorationProbability: CST.ENVIRONMENT.GRASS.PROBABILITIES[idx],
      })
    );
  }

  // get the frame name of the grass index as provided in the tileMap array
  getGrassFrame(idx: number): string {
    if (idx >= this.GRASS_OFFSET) {
      return this.grassFrames[idx - this.GRASS_OFFSET];
    } else if (idx < this.GRASS_OFFSET && idx >= this.BASE_OFFSET) {
      return this.baseFrames[idx - this.BASE_OFFSET];
    }
  }

  // Just call the method on the placement manager
  public placeRandomResources(
    scene: IsoScene,
    mapGrid: number[][],
    mapW: number,
    mapH: number,
    seed: string
  ) {
    let placementManager = PlacementManager.getInstance().placeRandomResources(
      scene,
      mapGrid,
      mapW,
      mapH,
      seed
    );

    // let environmentObjects = placementManager.oreObjects.concat(
    //   placementManager.treesObjects
    // );

    // // Index trees and ores
    // this.environmentObjStorage = new BboxKDStorage(environmentObjects);

    // for (let object of environmentObjects) {
    //   object.setActive(false).setVisible(false);
    // }

    // Start listening for map events
    //this.initListeners();

    PlacementManager.destroyInstance();
  }

  // Listen to the map view rectangle getting dirty
  // That means we have to redraw the objects in view
  // private initListeners() {
  //   if (this.initedListeners) {
  //     return;
  //   }

  //   this.initedListeners = true;

  //   MapManager.getInstance().events.on(
  //     CST.EVENTS.MAP.IS_DIRTY,
  //     this.enableObjectsInView.bind(this)
  //   );
  // }

  // Set the objects that are currently visible as active and visible
  // And also remove the ones that are not being visible anymore
  // private enableObjectsInView(viewRect: Phaser.Geom.Rectangle) {
  //   if (!this.environmentObjStorage) {
  //     return;
  //   }

  //   let objectBounds = new Phaser.Geom.Rectangle();

  //   // First, deactivate the object that are no longer visible to the player
  //   for (let sameYObjects of this.environmentObjInView.values()) {
  //     for (let [tileX, object] of sameYObjects.entries()) {
  //       object.getBounds(objectBounds);

  //       if (!Phaser.Geom.Rectangle.Overlaps(viewRect, objectBounds)) {
  //         object.setVisible(false).setActive(false);

  //         sameYObjects.delete(tileX);
  //       }
  //     }
  //   }

  //   let objectsInView = this.environmentObjStorage.getObjectsInView(viewRect);

  //   for (let object of objectsInView) {
  //     object.setActive(true).setVisible(true);

  //     // Index the object so we can deactivate it once it is no longer visible
  //     let { tileX, tileY } = object;
  //     if (!this.environmentObjInView.get(tileY)) {
  //       this.environmentObjInView.set(tileY, new Map());
  //     }

  //     this.environmentObjInView.get(tileY).set(tileX, object);
  //   }
  // }

  async preload(load: Phaser.Loader.LoaderPlugin) {
    this.loadResources(load);
  }

  loadResources(load: Phaser.Loader.LoaderPlugin) {
    const { ENVIRONMENT: ENV } = CST;

    load.setPath(ENV.MULTIATLAS_PATH);

    load.multiatlas(ENV.ATLAS_KEY, ENV.MULTIATLAS);

    // clear the path and prefix afterwards
    load.setPath();
  }

  generateFrames(scene: Phaser.Scene) {
    const { ENVIRONMENT: ENV } = CST;

    // reuse the parameters for both the generation of the grass frames
    // and the generation of the base frames
    let grassParams: [string, FrameGen] = [
      ENV.ATLAS_KEY,
      {
        start: ENV.GRASS.START,
        end: ENV.GRASS.END,
        zeroPad: ENV.GRASS.ZERO_PAD,
        prefix: ENV.GRASS.PREFIX,
      },
    ];

    this.grassFrames = scene.anims
      .generateFrameNames(...grassParams)
      .map((frame: Frame): string => String(frame.frame));

    grassParams[1].prefix = ENV.GRASS.BASE_PREFIX;

    this.baseFrames = scene.anims
      .generateFrameNames(...grassParams)
      .map((frame: Frame): string => String(frame.frame));

    // the frame names for the trees are different
    this.treesFrames = ENV.TREES.TREE_NAMES.map((name: string): string =>
      ENV.TREES.PREFIX.concat(name)
    );

    this.cliffFrames = ENV.CLIFFS.CLIFF_NAMES.map((name: string): string =>
      ENV.CLIFFS.PREFIX.concat(name)
    );

    this.oreFrames = ENV.ORES.ORES_NAMES.map((name: string): string =>
      ENV.ORES.PREFIX.concat(name)
    );

    this.setTileSize(scene);
  }

  // get the width and height of the game base tile
  private setTileSize(scene: Phaser.Scene) {
    let frame = scene.textures.getFrame(
      this.getTextureKey(),
      this.baseFrames[0]
    );

    this.TILE_WIDTH = frame.cutWidth;
    this.TILE_HEIGHT = frame.cutHeight;
  }

  public static getInstance() {
    return super.getInstance() as EnvironmentManager;
  }
}

Manager.subscribeToLoadingPhase(EnvironmentManager);
