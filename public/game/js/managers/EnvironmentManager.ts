import Phaser from "phaser";

import Manager from "./Manager";
import CST from "../CST";

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

  // CONSTANTS:
  public readonly GRASS_TILES_COUNT = CST.ENVIRONMENT.GRASS_TILES_COUNT;
  public readonly TREES_COUNT = CST.ENVIRONMENT.TREES_COUNT;

  public readonly GRASS_OFFSET = CST.ENVIRONMENT.GRASS_OFFSET;
  public readonly BASE_OFFSET = CST.ENVIRONMENT.BASE_OFFSET;

  public TILE_WIDTH: number;
  public TILE_HEIGHT: number;

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
        decorationProbability: CST.ENVIRONMENT.GRASS.PROBABILITIES[idx]
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

  async preload(load: Phaser.Loader.LoaderPlugin) {
    this.loadResources(load);
  }

  loadResources(load: Phaser.Loader.LoaderPlugin) {
    const { ENVIRONMENT: ENV } = CST;

    load.setPath(ENV.MULTIATLAS_PATH);
    load.setPrefix(ENV.TEXTURE_PREFIX);

    load.multiatlas(ENV.ATLAS_KEY, ENV.MULTIATLAS);

    // clear the path and prefix afterwards
    load.setPath();
    load.setPrefix();
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
        prefix: ENV.GRASS.PREFIX
      }
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

    // get the width and height of a tile
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
