import SimplexNoise from "simplex-noise";
import CST from "../CST";
import { Island, IslandHandler } from "./island";
import { NoiseMapDebugger } from "../utils/debug";

import Phaser from "phaser";

function linspace(
  startValue: number,
  stopValue: number,
  cardinality: number
): number[] {
  let arr = [];
  let step = (stopValue - startValue) / (cardinality - 1);
  for (let i = 0; i < cardinality; i++) {
    arr.push(startValue + step * i);
  }

  return arr;
}

// config used to add more subdivisions to the primary hills
// w = weight of the secondary noiseMap
// f = frequency used to generate the secondary noiseMap
interface SecondaryHillsConfig {
  w: number;
  f: number;
}

interface TerrainGeneratorConfig {
  // seed the noise generator
  seed?: string;
  // the size of the map in tiles
  width: number;
  height: number;
  // the frequency determines how many "hills" we have
  frequency?: number;
  // the weight of the main noise map when overlaying with others
  weight?: number;
  // raise the elevation of the terrain to this exponent
  exponent?: number;
  // if this noise map should be debugged
  debug?: boolean;
  // if the debugging is on, we need the phaser scene to draw the noise map
  scene?: Phaser.Scene;
}

class NoiseGenerator {
  private noiseGen: SimplexNoise;
  width: number;
  height: number;
  frequency: number;
  // the weight of the main noise map
  weight: number;
  exponent: number;

  // add more subdivisions to the original map
  secondaryHills: SecondaryHillsConfig[] = [];

  constructor(config: TerrainGeneratorConfig) {
    this.noiseGen = new SimplexNoise(config.seed);

    this.width = config.width;
    this.height = config.height;

    this.frequency = config.frequency || CST.MAP.DEFAULT_CFG.frequency;
    this.weight = config.weight || 1;
    this.exponent = config.exponent || CST.MAP.DEFAULT_CFG.exponent;
  }

  // add even more hills with each map having it's own frequency and final weight
  public addMoreNoiseMaps(configs: SecondaryHillsConfig[]) {
    this.secondaryHills = configs;
    return this;
  }

  // Manhattan distance from the center point on the map normalized to [0, 1]
  public centerDist(x: number, y: number) {
    let [midWidth, midHeight] = [this.width / 2, this.height / 2];

    // Manhattan distance
    // return (
    //   (Math.abs(x - midWidth) + Math.abs(y - midHeight)) /
    //   (midWidth + midHeight)
    // );

    return (
      Math.max(Math.abs(x - midWidth), Math.abs(y - midHeight)) /
      Math.max(midWidth, midHeight)
    );

    // Euclidean distance
    // let deltaX = x - midWidth,
    //   deltaY = y - midHeight;
    // return (
    //   Math.sqrt(deltaX * deltaX + deltaY * deltaY) / (midWidth + midHeight)
    // );
  }

  // push the middle up, the margins down, this way making an island terrain
  public makeIsland(noiseMap: number[][]): number[][] {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        noiseMap[y][x] = (1 + noiseMap[y][x] - this.centerDist(x, y)) / 2;
      }
    }

    return noiseMap;
  }

  // this creates the map of distances from the mid point
  // useful for debugging purposes
  public squareGradient(): number[][] {
    let noiseMap = [];
    for (let y = 0; y < this.height; y++) {
      noiseMap[y] = [];
      for (let x = 0; x < this.width; x++) {
        noiseMap[y][x] = this.centerDist(x, y);
      }
    }

    return noiseMap;
  }

  // generate noise
  public generateNoiseMap(): number[][] {
    let primaryNoise = this.getNoise(this.frequency, this.weight);

    // add secondary noise maps to the primary if requested
    let secondaryNoiseMaps = this.secondaryHills
      // generate the noise maps, keep the weight
      .map(({ w, f }: SecondaryHillsConfig): number[][] => this.getNoise(f, w));

    // combine all noiseMaps with the given weights
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let noiseSum = 0;
        // the sum of the weights of all combined noise maps
        let weightSum = this.weight;

        secondaryNoiseMaps.forEach((noiseMap, index) => {
          noiseSum += noiseMap[y][x];
          weightSum += this.secondaryHills[index].w;
        });

        primaryNoise[y][x] = (primaryNoise[y][x] + noiseSum) / weightSum;
        primaryNoise[y][x] = Math.pow(primaryNoise[y][x], this.exponent);
      }
    }

    return this.makeIsland(primaryNoise);
  }

  // generate a map of noise with the given frequency, also account for the weight if combining more noise maps
  private getNoise(freq: number, weight: number): number[][] {
    let noiseMap: number[][] = [];

    for (let y = 0; y < this.height; y++) {
      noiseMap[y] = [];

      for (let x = 0; x < this.width; x++) {
        let noiseX = x, /// this.width - 0.5,
          noiseY = y; /// this.height - 0.5;

        // map each value from [-1, 1] to [0, 1]
        noiseMap[y][x] =
          ((this.noiseGen.noise2D(noiseX * freq, noiseY * freq) + 1) / 2) *
          weight;
      }
    }

    return noiseMap;
  }
}

// singleton class that generates a matrix of tiles
export default class TerrainGenerator extends NoiseGenerator {
  private static instance: TerrainGenerator;
  debug: boolean = false;

  scene: Phaser.Scene = null;

  private constructor(config: TerrainGeneratorConfig) {
    super(config);

    this.debug = config.debug || this.debug;
    this.scene = config.scene || this.scene;
  }

  // get a map and an array of tiles and return a matrix of tiles
  public discretizeMap(map: number[][], tiles: number[]): number[][] {
    let discreteInterval = linspace(0, 1, tiles.length + 1),
      tileMap = [];

    for (let y = 0; y < this.height; y++) {
      tileMap[y] = [];

      for (let x = 0; x < this.width; x++) {
        for (let i = 1; i < discreteInterval.length; i++) {
          if (map[y][x] <= discreteInterval[i]) {
            tileMap[y][x] = tiles[i - 1];
            break;
          }
        }
      }
    }

    return tileMap;
  }

  // Remove secondary islands, returning a matrix holding only the primary island
  // All extra padding empty tiles are removed from the original map
  public getPrimaryIsle(map: number[][]): number[][] {
    let islandHandler = new IslandHandler(),
      isles = islandHandler.splitMapIntoIsles(map),
      primaryIsleMap = [];

    // get the largest isle
    let largestIsle = isles.reduce((maxIsle, currIsle) => {
      if (currIsle.size > maxIsle.size) {
        return currIsle;
      } else {
        return maxIsle;
      }
    });

    // once we have the largest isle, remove the others from the map
    isles.forEach(isle => {
      if (isle.size !== largestIsle.size) {
        islandHandler.fill(map, isle.anchor.x, isle.anchor.y, isle);
      }
    });

    // copy only the largest isle to the new map
    for (let y = largestIsle.topLeft.y; y <= largestIsle.bottomRight.y; y++) {
      primaryIsleMap[y - largestIsle.topLeft.y] = [];

      for (let x = largestIsle.topLeft.x; x <= largestIsle.bottomRight.x; x++) {
        primaryIsleMap[y - largestIsle.topLeft.y][x - largestIsle.topLeft.x] =
          map[y][x];
      }
    }

    return primaryIsleMap;
  }

  // get the tiles used for the generation of this island
  public generateIslandTerrain(tiles: number[]): number[][] {
    let terrain = this.generateNoiseMap(),
      tiledMap = this.discretizeMap(terrain, tiles);

    // if debugging is enabled, show the noise map at coords (0, 0)
    if (this.debug && this.scene) {
      new NoiseMapDebugger(this.scene).enableDebugging().showNoiseMap(terrain);
    }

    return this.getPrimaryIsle(tiledMap);
  }

  // get the class instance. The first time it is called, a config object has to be passed along
  public static getInstance(config?: TerrainGeneratorConfig) {
    if (!TerrainGenerator.instance) {
      if (!config) {
        throw new Error(
          "Cannot instantiate TerrainGenerator class without a config"
        );
      }

      TerrainGenerator.instance = new TerrainGenerator(config);
    }

    return TerrainGenerator.instance;
  }
}
