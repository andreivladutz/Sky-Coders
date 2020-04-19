// THE ENUM VALUES SHOULD BE THE SAME AS THEIR STRING LITERAL VALUES
export enum BuildNames {
  residential = "residential"
}

interface BuildingSize {
  widthX: number;
  widthY: number;
}

interface LocalPosition {
  localTileX: number;
  localTileY: number;
}

export interface Resources {
  coins: number;
}

// The map tile coordinate positioning of a building
export interface TilePosition {
  x: number;
  y: number;
}

// The class used to describe all buildings
export class BuildingType {
  type: BuildNames;
  size: BuildingSize;
  // The position of the center tile
  // Relative to the local grid of the object
  localPos: LocalPosition;
  productionTime: number;
  // How much resources this building produces per productionTime
  productionResources: Resources;
  // How much resources are needed to build this construction
  buildCost: Resources;

  constructor(
    type: BuildNames,
    widthX: number,
    widthY: number,
    localTileX: number,
    localTileY: number,
    productionTime: number,
    productionResources: Resources,
    buildCost: Resources
  ) {
    this.type = type;
    this.size = { widthX, widthY };
    this.localPos = { localTileX, localTileY };
    this.productionTime = productionTime;
    this.productionResources = productionResources;
    this.buildCost = buildCost;
  }
}

// The information held on a building in the server's db
export interface DbBuildingInfo {
  // The name of the building used to identify it in the building types
  buildingType: BuildNames;
  // The tile position of this building
  position: TilePosition;
  // The last time this building produced resources (were collected)
  lastProdTime?: number;
}

// Define all the different types of the buildings
const BuildingTypes = {
  [BuildNames.residential]: new BuildingType(
    BuildNames.residential,
    6,
    6,
    3,
    3,
    1000,
    { coins: 100 },
    { coins: 100 }
  )
};

export default BuildingTypes;
