import TerrainGenerator from "../terrain/terrainGenerator";
import TileMap from "../IsoPlugin/TileMap";
import CST from "../CST";
import { IsoScene } from "../IsoPlugin/IsoPlugin";

const TILE_WIDTH = 256,
  TILE_HEIGHT = 148;

/*
 * Singleton class that handles asset loading and terrain generation
 *
 */
export default class MapController {
  public static instance: MapController = null;

  // the simplex noise based terrain generator
  terrainGen: TerrainGenerator;
  // tile map container class
  tileMap: TileMap;
  // the matrix of tiles where map data is held
  mapMatrix: number[][];
  gameScene: IsoScene;

  private constructor() {}

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

    this.mapMatrix = this.terrainGen.generateIslandTerrain([0, 1, 1]);
  }

  // terrain generation happens in the loading stage of the game
  preloadInit() {
    this.generateIsland();
  }

  /**
   * @param {IsoScene} gameScene The game scene that renders the tile map
   */
  initMap(gameScene: IsoScene): TileMap {
    this.gameScene = gameScene;

    return (this.tileMap = new TileMap({
      scene: this.gameScene,
      tileWidth: TILE_WIDTH,
      tileHeight: TILE_HEIGHT,
      mapWidth: CST.MAP.WIDTH,
      mapHeight: CST.MAP.HEIGHT,
      mapMatrix: this.mapMatrix
    }));
  }

  public static getInstance(): MapController {
    if (MapController.instance === null) {
      MapController.instance = new MapController();
    }

    return MapController.instance;
  }
}
