/*
 * Functions used to easily split terrain into islands
 */

interface Point {
  x: number;
  y: number;
}

// One island representation
export class Island {
  // first found point of this island, used to start the fill
  anchor: Point = { x: 0, y: 0 };
  // island bounds in the map
  topLeft: Point = { x: 0, y: 0 };
  bottomRight: Point = { x: 0, y: 0 };
  // Size of this island in tiles
  size: number = 0;

  constructor(x: number, y: number) {
    this.topLeft = { x, y };
    this.anchor = { x, y };
    this.bottomRight = { x, y };
  }

  // Check if the x and y coords extend this isle and extend it
  extendIsle(x: number, y: number) {
    if (x < this.topLeft.x) {
      this.topLeft.x = x;
    }
    if (x > this.bottomRight.x) {
      this.bottomRight.x = x;
    }
    if (y < this.topLeft.y) {
      this.topLeft.y = y;
    }
    if (y > this.bottomRight.y) {
      this.bottomRight.y = y;
    }
  }
}

export class IslandHandler {
  // Clone a map we split into islands so it doesn't get destroyed by the fill algorithm
  cloneMap(map: number[][]): number[][] {
    let newMap = [];

    for (let y = 0; y < map.length; y++) {
      newMap[y] = [];

      for (let x = 0; x < map[y].length; x++) {
        newMap[y][x] = map[y][x];
      }
    }
    return newMap;
  }

  // Splits a map of tiles into multiple islands
  // 0 is considered an empty tile, whereas any non-zero value is considered a tile
  splitMapIntoIsles(map: number[][]): Island[] {
    let isles = [];
    // work on a clone
    map = this.cloneMap(map);

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (map[y][x] !== 0) {
          // found a new island
          isles.push(new Island(x, y));
          this.fill(map, x, y, isles[isles.length - 1]);
        }
      }
    }

    return isles;
  }

  // Fill a whole isle with 0s
  fill(map: number[][], x: number, y: number, isle: Island) {
    if (
      x < 0 ||
      y < 0 ||
      y >= map.length ||
      x >= map[y].length ||
      map[y][x] === 0
    ) {
      return;
    }

    let q = [{ y, x }];

    for (let pt of q) {
      let west = pt.x,
        east = pt.x;

      // go farthest to the west and to the east
      while (west >= 0 && map[pt.y][west] !== 0) {
        west--;
      }

      while (east < map[pt.y].length && map[pt.y][east] !== 0) {
        east++;
      }

      for (let i = west + 1; i < east; i++) {
        map[pt.y][i] = 0;
        isle.size++;
        isle.extendIsle(i, pt.y);

        // there's terrain to the north
        if (pt.y - 1 >= 0 && map[pt.y - 1][i]) {
          q.push({ x: i, y: pt.y - 1 });
        }
        // there's terrain to the south
        if (pt.y + 1 < map.length && map[pt.y + 1][i]) {
          q.push({ x: i, y: pt.y + 1 });
        }
      }
    }
  }
}
