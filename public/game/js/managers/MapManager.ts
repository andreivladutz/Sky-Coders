import TerrainGenerator from "../terrain/terrainGenerator";
import TileMap from "../IsoPlugin/TileMap";
import { IsoScene } from "../IsoPlugin/IsoPlugin";

import Manager from "./Manager";
import CST from "../CST";
import EnvironmentManager from "./EnvironmentManager";

/*
 * Singleton class that handles asset loading and terrain generation
 *
 */
export default class MapManager extends Manager {
  // the simplex noise based terrain generator
  terrainGen: TerrainGenerator;
  // tile map container class
  tileMap: TileMap;
  // the matrix of tiles where map data is held
  mapMatrix: number[][];
  gameScene: IsoScene;

  envManager: EnvironmentManager = EnvironmentManager.getInstance();

  generateIsland() {
    this.terrainGen = TerrainGenerator.getInstance({
      seed: "nice",
      width: CST.MAP.WIDTH,
      height: CST.MAP.HEIGHT,
      frequency: CST.MAP.DEFAULT_CFG.frequency
      // pass along for debugging the noise map
      //debug: true,
      //scene: this
    }); //.addMoreNoiseMaps([{ f: 0.01, w: 0.3 }]);

    this.mapMatrix = this.terrainGen.generateIslandTerrain({
      emptyTileRatio: CST.ENVIRONMENT.EMPTY_TILE_RATIO,
      tileConfigs: this.envManager.getTilesIndicesConfigs()
    });
  }

  // terrain generation happens in the loading stage of the game
  async preload() {
    this.generateIsland();
  }

  /**
   * @param {IsoScene} gameScene The game scene that renders the tile map
   */
  initMap(gameScene: IsoScene): TileMap {
    this.gameScene = gameScene;

    // generate environment frames
    this.envManager.generateFrames(gameScene);

    return (this.tileMap = new TileMap({
      scene: this.gameScene,
      tileWidth: this.envManager.TILE_WIDTH,
      tileHeight: this.envManager.TILE_HEIGHT,
      mapWidth: CST.MAP.WIDTH,
      mapHeight: CST.MAP.HEIGHT,
      mapMatrix: this.mapMatrix
    }));
  }

  public static getInstance(): MapManager {
    return super.getInstance() as MapManager;
  }
}

Manager.subscribeToLoadingPhase(MapManager);
