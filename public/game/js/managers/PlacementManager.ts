import Manager from "./Manager";
import CST from "../CST";
import EnvironmentManager from "./EnvironmentManager";

// the plugin used for random placement
import RandomPlace from "../plugins/RandomPlace/RandomPlace";
import IsoSpriteObject from "../gameObjects/IsoSpriteObject";
import IsoScene from "../IsoPlugin/IsoScene";

interface Tile {
  x: number;
  y: number;
}

// how much to extend a region in the four directions
interface RegionExtension {
  extendUp: number;
  extendDown: number;
  extendRight: number;
  extendLeft: number;
}

class RandomPlacedPoint {
  // the midpoint tile coord
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class Region extends RandomPlacedPoint {
  // the tiles composing this region
  regionTiles: Tile[] = [];

  // extend the midPoint to a full region
  extendRegion(mapGrid: number[][]) {
    // how much to extend around the midpoint in one direction
    let tilePadding = Math.floor((CST.REGIONS.MAXSIZE - 1) / 2);

    this.addTilesToRegion(
      this,
      {
        extendUp: tilePadding,
        extendDown: tilePadding,
        extendLeft: tilePadding,
        extendRight: tilePadding
      },
      mapGrid
    );
  }

  /**
   *
   * @param position the position of the current extension tile to try
   * @param extCfg how much to further extend the current tile and in which directions
   * @param mapGrid a reference to the mapGrid
   */
  private addTilesToRegion(
    position: Tile,
    extCfg: RegionExtension,
    mapGrid: number[][]
  ) {
    if (outOfBounds(position, mapGrid)) {
      return;
    }

    const max = Math.max,
      min = Math.min;

    // extend amap upwards
    for (
      let y = position.y - 1;
      y >= max(position.y - extCfg.extendUp, 0);
      y--
    ) {
      this.addTilesToRegion(
        { x: position.x, y },
        {
          extendUp: 0,
          extendDown: 0,
          extendLeft: extCfg.extendLeft,
          extendRight: extCfg.extendRight
        },
        mapGrid
      );
    }

    // extend amap downards
    for (
      let y = position.y + 1;
      y <= min(position.y + extCfg.extendDown, mapGrid.length - 1);
      y++
    ) {
      this.addTilesToRegion(
        { x: position.x, y },
        {
          extendUp: 0,
          extendDown: 0,
          extendLeft: extCfg.extendLeft,
          extendRight: extCfg.extendRight
        },
        mapGrid
      );
    }

    // extend horizontally adding the tiles to the region if possible
    for (
      let x = max(position.x - extCfg.extendLeft, 0);
      x <= min(position.x + extCfg.extendRight, mapGrid[0].length - 1);
      x++
    ) {
      if (mapGrid[position.y][x] !== CST.ENVIRONMENT.EMPTY_TILE) {
        this.regionTiles.push({
          y: position.y,
          x
        });
      }
    }
  }
}

export default class PlacementManager extends Manager {
  // reference to the map grid
  mapGrid: number[][];

  // the sizes of the map
  mapW: number;
  mapH: number;

  regions: Region[];
  // trees objects placed on the map
  treesObjects: IsoSpriteObject[] = [];
  // ore objects placed on the map
  oreObjects: IsoSpriteObject[] = [];

  // the key of the texture holding all environment assets
  envTexture: string;

  private RND: Phaser.Math.RandomDataGenerator;

  // generate the regions of the placement
  private generateRegions() {
    // just some points used to represent regions' tile mid points
    this.regions = [];

    for (let i = 0; i < CST.REGIONS.N_REG; i++) {
      this.regions.push(new Region());
    }

    // the size of a region in tiles
    const regSize = CST.REGIONS.MAXSIZE;

    RandomPlace(this.regions, {
      radius: (regSize * Math.SQRT2) / 2,
      // callback used to get the positions of the tiles
      getPositionCallback: (out: Region) => {
        // Generate random tile positions until we find a non empty tile
        do {
          out.x = this.RND.integerInRange(0, this.mapW - 1);
          out.y = this.RND.integerInRange(0, this.mapH - 1);
        } while (this.mapGrid[out.y][out.x] === CST.ENVIRONMENT.EMPTY_TILE);
      }
    });

    // extend all regions as much as possible
    for (let region of this.regions) {
      region.extendRegion(this.mapGrid);
    }

    // filter out all empty regions
    this.regions = this.regions.filter(region => {
      return region.regionTiles.length !== 0;
    });
  }

  private _placeResources(scene: IsoScene) {
    const envManager = EnvironmentManager.getInstance(),
      REG = CST.REGIONS,
      TREE_ID = CST.LAYERS.OBJ_ID.TREE,
      ORE_ID = CST.LAYERS.OBJ_ID.ORE;

    let treesFrames = envManager.treesFrames,
      oreFrames = envManager.oreFrames,
      // each ore sits in one region
      oreRegionsPicked = [];

    let regionIdx = 0;
    // pick a region for each oreFrame to place
    for (let oreFrame of oreFrames) {
      oreRegionsPicked.push({
        region: this.regions[regionIdx++],
        frame: oreFrame
      });
    }

    // take each region and place trees randomly in it
    for (let region of this.regions) {
      let regTiles = region.regionTiles,
        // configuration of the trees with the radius of the empty space around them
        treesCfg = [];

      // Pick a random tree frame for this region, this way, same trees are clustered in regions
      let treeFrame = this.RND.pick(treesFrames);

      // go through the regions picked for the placing of the ores
      // if this region is one of those, than place the appropiate ore here
      for (let oreRegion of oreRegionsPicked) {
        if (region == oreRegion.region) {
          treesCfg.push({
            gameObject: new RandomPlacedPoint(-1, -1),
            radius: REG.ORE_RADIUS,
            // this is how we will know the object is an ore object
            ore: oreRegion.frame
          });
        }
      }

      // place some trees randomly -> pushing the config objects used by the RandomPlace plugin
      for (
        let i = 0;
        i < this.RND.integerInRange(REG.MINTREES, REG.MAXTREES);
        i++
      ) {
        treesCfg.push({
          gameObject: new RandomPlacedPoint(-1, -1),
          radius: REG.TREE_RADIUS,
          // this is added so we can differentiate trees from other resources
          tree: true
        });
      }

      RandomPlace(treesCfg, {
        getPositionCallback: (out: RandomPlacedPoint) => {
          // pick a random tile to place the game resource on
          let tile: Tile;

          // but make sure it isn't a marginal tile (being on the border of the island)
          do {
            tile = this.RND.pick(regTiles);
          } while (
            isMargin(tile.x, tile.y, this.mapGrid, this.mapW, this.mapH)
          );

          out.x = tile.x;
          out.y = tile.y;
        }
      });

      // take each placed object and transform it into a real game object
      for (let cfgObj of treesCfg) {
        // This game object couldn't be placed
        if (cfgObj.gameObject.x === -1 || cfgObj.gameObject.y === -1) {
          continue;
        }

        let pos: RandomPlacedPoint = cfgObj.gameObject;

        if (cfgObj.tree) {
          this.treesObjects.push(
            new IsoSpriteObject({
              scene,
              tileX: pos.x,
              tileY: pos.y,
              objectId: TREE_ID,
              texture: this.envTexture,
              frame: treeFrame
            })
          );
        }

        if (cfgObj.ore) {
          this.oreObjects.push(
            new IsoSpriteObject({
              scene,
              tileX: pos.x,
              tileY: pos.y,
              objectId: ORE_ID,
              texture: this.envTexture,
              frame: cfgObj.ore
            })
          );
        }
      }
    }
  }

  /**
   *   place the resources of the game:
   *  - trees
   *  - ore
   */
  public placeRandomResources(
    scene: IsoScene,
    mapGrid: number[][],
    mapW: number,
    mapH: number,
    seed: string
  ): this {
    this.mapGrid = mapGrid;
    this.mapW = mapW;
    this.mapH = mapH;

    this.envTexture = EnvironmentManager.getInstance().getTextureKey();

    this.RND = Phaser.Math.RND;
    this.RND.init([seed]);

    this.generateRegions();
    this._placeResources(scene);

    return this;
  }

  public static getInstance() {
    return super.getInstance() as PlacementManager;
  }

  // Destroy the instance and free up memory once this manager is not used anymore
  public static destroyInstance() {
    this._instance = null;
  }
}

// module private functions
function outOfBounds(tile: Tile, mapGrid: number[][]) {
  return (
    tile.y < 0 ||
    tile.y >= mapGrid.length ||
    tile.x < 0 ||
    tile.x >= mapGrid[0].length
  );
}

function* getNeighbours(x: number, y: number): Generator<Tile> {
  let directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1]
  ];

  for (let direction of directions) {
    yield { x: x + direction[1], y: y + direction[0] };
  }
}

// check if margin tile
function isMargin(
  x: number,
  y: number,
  mapGrid: number[][],
  mapW: number,
  mapH: number
) {
  for (let tile of getNeighbours(x, y)) {
    if (x === 0 || x === mapW || y === mapH || y === 0) {
      return true;
    }

    if (
      mapGrid[tile.y] &&
      mapGrid[tile.y][tile.x] === CST.ENVIRONMENT.EMPTY_TILE
    ) {
      return true;
    }
  }

  return false;
}
