globalThis.NavObjectHelpers = class {
  // correspondants of the properties in the NavSpriteObjects:
  // tile position of the object relative to the local grid
  localTileX;
  localTileY;
  // how wide and long the tile grid is
  tileWidthX;
  tileWidthY;
  // the world map sizes and grid
  mapWidth;
  mapHeight;
  mapGrid;
  // the tile objects cannot walk on (it probably is 0)
  unwalkableTile;

  constructor(config) {
    this.localTileX = config.localTileX;
    this.localTileY = config.localTileY;
    this.tileWidthX = config.tileWidthX;
    this.tileWidthY = config.tileWidthY;

    this.mapWidth = config.mapWidth;
    this.mapHeight = config.mapHeight;

    this.mapGrid = config.mapGrid;

    this.unwalkableTile = config.unwalkableTile;
  }

  // smoothen the path walked by this game object
  // * do not want to walk in zig zags if succesive tiles are on a diagonal
  // * if succesive tiles are on a line, we can keep the extremes of the lines only
  smoothPath(path) {
    let i = 0,
      n = path.length,
      smoothedPath = [];

    const getDx = (a, b) => a.x - b.x,
      getDy = (a, b) => a.y - b.y,
      abs = Math.abs;

    while (i < n) {
      smoothedPath.push(path[i]);

      // if there is a next tile in the path check if it's diagonal to this tile
      if (path[i + 1]) {
        let dx = getDx(path[i + 1], path[i]),
          dy = getDy(path[i + 1], path[i]);

        // no diagonals allowed
        if (abs(dx) !== abs(dy)) {
          // we can skip the tile in-between i.e. tile at i + 1
          do {
            i = i + 1;
          } while (
            path[i + 1] &&
            getDx(path[i + 1], path[i]) === dx &&
            getDy(path[i + 1], path[i]) === dy
          );

          smoothedPath.push(path[i]);
        }
      }

      i = i + 1;
    }

    return smoothedPath;
  }

  // Get the list of tiles composing this object's grid
  // we specify a certain tile's coords to get the grid around that tile
  getGridTiles(currTileX, currTileY) {
    // the tiles occupied by this game object
    // they are relative to the (tileX, tileY) coords of the origin
    let gridTiles = [];

    // how are these tiles positioned relative to the localTileX, localTileY?
    for (let x = 0; x < this.tileWidthX; x++) {
      for (let y = 0; y < this.tileWidthY; y++) {
        let dX = x - this.localTileX,
          dy = y - this.localTileY;

        gridTiles.push({ x: currTileX + dX, y: currTileY + dy });
      }
    }

    return gridTiles;
  }

  // this function will be called to compute whether a tile should be walked on or not
  walkableCallback(currTile) {
    // tiles ocuppied by this object
    let gridTiles = this.getGridTiles(currTile.x, currTile.y);

    // check if any of the tiles of this object's grid overlaps a blocker. if so it's a no-no!
    for (let tile of gridTiles) {
      // also check if any of the object's grid tile ended up being out of world bounds
      if (
        tile.x < 0 ||
        tile.x >= this.mapWidth ||
        tile.y < 0 ||
        tile.y >= this.mapHeight
      ) {
        return false;
      }

      if (this.mapGrid[tile.y][tile.x] === this.unwalkableTile) {
        return false;
      }
    }

    // this tile is safe to walk on
    return true;
  }
};
