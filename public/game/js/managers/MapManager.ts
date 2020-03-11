import TerrainGenerator from "../terrain/terrainGenerator";
import TileMap from "../IsoPlugin/TileMap";
import { IsoScene } from "../IsoPlugin/IsoPlugin";

import Manager from "./Manager";
import CST from "../CST";
import EnvironmentManager from "./EnvironmentManager";
import IsoSpriteObject from "./IsoSpriteObject";
import { IsoDebugger } from "../utils/debug";
import IsoBoard from "../IsoPlugin/IsoBoard";
import CameraManager from "./CameraManager";

interface Point {
  x: number;
  y: number;
}

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

  private debuggingActive: boolean = false;
  // list of game objects to debug
  private debuggingObjects: IsoSpriteObject[];
  isoDebug: IsoDebugger;

  // returns the {x, y} corresponding world coords
  public tileToWorldCoords(tileX: number, tileY: number): Point {
    return this.getIsoBoard().board.tileXYToWorldXY(tileX, tileY);
  }

  // returns the {x, y} corresponding tile coords
  public worldToTileCoords(worldX: number, worldY: number): Point {
    return this.getIsoBoard().board.worldXYToTileXY(worldX, worldY);
  }

  // returns the {x, y} corresponding floating tile coords
  public worldToFloatTileCoords(worldX: number, worldY: number): Point {
    return this.getIsoBoard().worldXYToTileXYFloat(worldX, worldY);
  }

  // Set the scrolling of the camera such that it's centered over these tile coords
  public setScrollOverTiles(tileX: number, tileY: number): this {
    let tilesWorldCoords = this.tileToWorldCoords(tileX, tileY);

    CameraManager.getInstance().centerOn(
      tilesWorldCoords.x,
      tilesWorldCoords.y
    );

    return this;
  }

  public addSpriteObjectToGrid(
    obj: IsoSpriteObject,
    tileX: number,
    tileY: number
  ) {
    this.tileMap.isoBoard.board.addChess(obj, tileX, tileY);
  }

  public getIsoBoard(): IsoBoard {
    return this.tileMap.isoBoard;
  }

  public onUpdate() {
    this.tileMap.isoBoard.onUpdate();
    this.tileMap.onUpdate();

    if (this.debuggingActive) {
      this.isoDebug.debugIsoSprites(this.debuggingObjects, 0xeb4034, false);
    }
  }

  // enable global debugging => bodies of isoSpriteObjects will be drawn
  public enableDebugging(): this {
    this.debuggingActive = true;

    this.debuggingObjects = [];

    this.isoDebug = new IsoDebugger(
      this.gameScene,
      this.gameScene.iso
    ).enableDebugging();

    return this;
  }

  public addToDebuggingObjects(obj: IsoSpriteObject): this {
    // debugging has not been activated
    if (!this.debuggingActive) {
      return this;
    }

    this.debuggingObjects.push(obj);

    return this;
  }

  generateIsland() {
    // TODO: change the seed with a server-generated seed
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

    // call onUpdate on the components every update cycle
    // the order is important
    this.gameScene.events.on("update", () => {
      this.onUpdate();
    });

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
