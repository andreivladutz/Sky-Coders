import { IsoScene, Point3 } from "../IsoPlugin/IsoPlugin";
import IsoBoard, { TileXY, ViewExtremes } from "./IsoBoard";
import IsoTile from "./IsoTile";

// import List from "../utils/dataTypes/List";
import CST from "../CST";
import EnvironmentManager from "../managers/EnvironmentManager";
import LayersManager from "../managers/LayersManager";
import CameraManager from "../managers/CameraManager";

interface TileMapConfig {
  scene: IsoScene;
  // real size of a tile texture
  tileWidth: number;
  tileHeight: number;
  // map size in tiles
  mapWidth: number;
  mapHeight: number;
  mapMatrix: number[][];
}

interface TileChunk {
  // Pixel coordinates
  topY?: number;
  bottomY?: number;
  leftX?: number;
  rightX?: number;
  // the tiles contained (or belong to the rows contained)
  topDiagonalTile: number;
  bottomDiagonalTile: number;

  leftmostCoordX: number;
  leftmostCoordY: number;

  rightmostCoordX: number;
  rightmostCoordY: number;
}

interface CanvasTileChunk extends HTMLCanvasElement {
  // The initial positioning of the chunk
  _chunkPosition?: TileChunk;
  // The positioning of the chunk in the world
  currentPosition?: {
    leftX?: number;
    topY?: number;

    width?: number;
    height?: number;
  };
  isVisible?: boolean;
}

type CliffsMatrix = { [key: number]: { [key: number]: IsoTile } };

export default class TileMap {
  // the game scene this
  scene: IsoScene;
  // the underlying board provided by the Board Plugin
  isoBoard: IsoBoard;

  // Tilesize of the map
  mapWidth: number;
  mapHeight: number;

  // real size of a tile texture
  tileWidth: number;
  tileHeight: number;

  // the map data of tile indices
  mapMatrix: number[][];
  // for each (y, x) tilesInPlace[y][x] represents if the tile at (x, y) coords
  // is already in place, otherwise a tile should be instanced and placed at those coords
  // tilesInPlace: IsoTile[][] = [];

  // tile pools
  // unusedPool: List<IsoTile>;
  // usedPool: List<IsoTile>;

  // Keep the old view rect so we can free unused tiles into the pool
  // oldView: ViewExtremes;

  envManager: EnvironmentManager;

  // always remember the last tinted tile so we can clear its tint when we leave the tile
  lastTintedTile: IsoTile;

  // Use multiple canvases to draw pieces of the map
  // each map canvas is a normal HTML Canvas element with added chunkPosition property
  mapCanvases: CanvasTileChunk[][] = [];
  // The layer canvas the chunks get drawn to
  mapCanvasLayer: HTMLCanvasElement;

  // Keep count of the origin point (0, 0) and where it is sitting now in world coordinates
  // In case the point changes, move the map and redraw
  originPoint: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  // A repositioning is waiting for the next render cycle
  willReposition: boolean = false;
  // When the device's browser resizes recompute the positions on the next render cycle
  willRecomputePositions: boolean = false;

  constructor(config: TileMapConfig) {
    this.scene = config.scene;

    // the used projector
    let projector = this.scene.iso.projector;

    // determine the position of the map corner
    let { x: mapX, y: mapY } = projector.project(new Point3(0, 0, 0));

    this.tileWidth = config.tileWidth;
    this.tileHeight = config.tileHeight;
    this.mapWidth = config.mapWidth;
    this.mapHeight = config.mapHeight;

    this.isoBoard = IsoBoard.getInstance({
      scene: this.scene,
      x: mapX,
      y: mapY,
      tileWidth: config.tileWidth,
      tileHeight: config.tileHeight,
      mapWidth: config.mapWidth,
      mapHeight: config.mapHeight,
      mapMatrix: config.mapMatrix
    });

    // the map data with tile indices
    this.mapMatrix = config.mapMatrix;

    this.envManager = EnvironmentManager.getInstance();

    // init the pools of used and unused tiles
    // this.usedPool = new List();
    //this.unusedPool = new List();

    // no tile is in place at first
    // this.initTilesInPlace();

    // add event listeners
    this.registerToEvents();

    this.initMapCanvasLayer();

    // generate the frames for the cliffs (the margins of the world)
    // A sparse matrix kept to recognize tiles that are cliffs (i.e. they are margins of the world)
    // if a tile is a cliff, then this matrix will keep its IsoTile
    let cliffsSparseMatrix: CliffsMatrix = {};
    this.generateCliffs(cliffsSparseMatrix);

    this.bufferMapPieces(cliffsSparseMatrix);
    this.redrawMap();

    // window.onkeydown = () => {
    //   let extremes = this.isoBoard.getExtremesTileCoords(true);

    //   let topY = extremes.topmostY,
    //     lowY = extremes.lowermostY,
    //     rightX = extremes.rightmostX,
    //     leftX = extremes.leftmostX,
    //     midX = Math.floor((rightX + leftX) / 2);

    //   // The maximum distance from the middle y to top / low y
    //   let deltaX = Math.max(midX - leftX, rightX - midX);

    //   // The visible tiles form a rhombus
    //   for (let dX = 0; dX <= deltaX; dX++) {
    //     for (let x of [midX - dX, midX + dX]) {
    //       for (let y = topY + dX; y <= lowY - dX; y++) {
    //         console.log(x, y);
    //       }
    //     }
    //   }

    //   for (let x = extremes.leftmostX; x <= extremes.rightmostX; x++) {
    //     for (let y = extremes.topmostY; y <= extremes.lowermostY; y++) {
    //       this.onTileOver({ x, y });
    //     }
    //   }
    // };
  }

  // Initialize a map canvas and add it to the DOM
  private initMapCanvasLayer() {
    this.mapCanvasLayer = document.createElement("canvas");

    this.mapCanvasLayer.style.top = "0";
    this.mapCanvasLayer.style.left = "0";
    this.mapCanvasLayer.style.position = "absolute";
    this.mapCanvasLayer.style.zIndex = "-1";

    document.body.appendChild(this.mapCanvasLayer);
  }

  // Get the world positions of each canvas chunk of tiles
  private getChunksPositions(): TileChunk[][] {
    // Create an array of tile chunks positions and return them
    let chunks: TileChunk[][] = [];
    // The width and height in tiles of a tile chunk
    const { HEIGHT } = CST.TILEMAP.CHUNK;

    // rowUp is the top tile row (both y and x coord) on the "diagonal" straight down
    // rowDown is the bottom tile row contained by the current chunk box
    let rowUp = 0,
      rowDown: number;

    // half of the chunks
    let noChunksHeight = Math.ceil(this.mapHeight / (HEIGHT * 2));
    let totalChunksHeight = Math.ceil(this.mapHeight / HEIGHT);

    for (let chunkY = 0; chunkY < noChunksHeight; chunkY++) {
      chunks[chunkY] = [];

      rowDown = rowUp + HEIGHT - 1;

      // The current row
      chunks[chunkY] = this.getRowOfChunks(rowUp);

      // The symmetric of this row on the screen y axis through the middle of the map
      let symmetricChunkY = totalChunksHeight - (chunkY + 1);

      chunks[symmetricChunkY] = [];
      // Get the symmetric chunk for each of the computed chunks on the row
      for (let chunkX in chunks[chunkY]) {
        chunks[symmetricChunkY][chunkX] = {
          topDiagonalTile: HEIGHT * symmetricChunkY,
          bottomDiagonalTile: HEIGHT * (symmetricChunkY + 1) - 1,

          leftmostCoordX: chunks[chunkY][chunkX].leftmostCoordX,
          leftmostCoordY: chunks[chunkY][chunkX].leftmostCoordY,
          rightmostCoordX: chunks[chunkY][chunkX].rightmostCoordX,
          rightmostCoordY: chunks[chunkY][chunkX].rightmostCoordY
        };
      }

      // Get to the next row of boxes
      rowUp = rowDown + 1;
    }

    return chunks;
  }

  // Process a row of box chunks i.e. knowing the top tileY of the diagonal it contains
  // Get a row full of this chunks positions
  private getRowOfChunks(rowUp: number): TileChunk[] {
    // Create an array of tile chunks positions and return them
    let chunks: TileChunk[] = [];
    // The width and height in tiles of a tile chunk
    const { HEIGHT, WIDTH } = CST.TILEMAP.CHUNK;

    let rowDown = rowUp + HEIGHT - 1;

    // how wide (in tiles) is the last row contained by this chunk box (the widest row)
    let longestRowWidth = (rowDown + 1) * 2 - 1;

    // how many box chunks for this current rows (to contain everything)
    let noChunksWidth = Math.ceil(longestRowWidth / WIDTH);
    // This is the sum for the diagonal indices and is the same sum for
    // all pairs of indices on this current row (the lowermost one)
    let coordSum = longestRowWidth - 1;

    for (let chunkX = 0; chunkX < noChunksWidth; chunkX++) {
      // the leftmost and rightmost tiles contained by this box on the last row
      let tileLeftX = chunkX * WIDTH;
      let tileRightX = (chunkX + 1) * WIDTH - 1;

      chunks.push({
        topDiagonalTile: rowUp,
        bottomDiagonalTile: rowDown,

        leftmostCoordX: tileLeftX,
        leftmostCoordY: coordSum - tileLeftX,
        rightmostCoordX: tileRightX,
        rightmostCoordY: coordSum - tileRightX
      });
    }

    return chunks;
  }

  // Position a chunk by using its tile extremes
  private positionCanvasChunk(chunk: CanvasTileChunk) {
    let chunkExtremes = chunk._chunkPosition;
    let [topY, bottomY] = this.getTopBottomYChunkRow(
      chunkExtremes.topDiagonalTile,
      chunkExtremes.bottomDiagonalTile
    );

    // the leftmost pair of coord contained by this box on the last row (their sum has to be coordSum)
    let leftX = Math.floor(
      this.isoBoard.board.tileXYToWorldXY(
        chunkExtremes.leftmostCoordX,
        chunkExtremes.leftmostCoordY
      ).x - this.tileWidth
    );

    let rightX = Math.ceil(
      this.isoBoard.board.tileXYToWorldXY(
        chunkExtremes.rightmostCoordX,
        chunkExtremes.rightmostCoordY
      ).x + this.tileWidth
    );

    chunkExtremes.topY = topY;
    chunkExtremes.bottomY = bottomY;
    chunkExtremes.leftX = leftX;
    chunkExtremes.rightX = rightX;
  }

  private recomputeChunkPixelPositions() {
    for (let canvasesRow of this.mapCanvases) {
      for (let mapCanvas of canvasesRow) {
        this.positionCanvasChunk(mapCanvas);
      }
    }
  }

  // Get [topY, bottomY] coords for a row of chunks
  private getTopBottomYChunkRow(
    rowUp: number,
    rowDown: number
  ): [number, number] {
    // get the topmost Y and lowermost Y of the box chunk
    let bottomY = Math.ceil(
      this.isoBoard.board.tileXYToWorldXY(rowDown, rowDown).y + this.tileHeight
    );
    let topY = Math.floor(
      this.isoBoard.board.tileXYToWorldXY(rowUp, rowUp).y - this.tileHeight
    );

    return [topY, bottomY];
  }

  // Draw map in chunks on different canvases
  private bufferMapPieces(cliffsSparseMatrix: CliffsMatrix) {
    let chunksBounds = this.getChunksPositions();

    let tile = new IsoTile(
      this.scene,
      0,
      0,
      0,
      0,
      EnvironmentManager.getInstance().getTextureKey()
    );

    let chunkViewRect = new Phaser.Geom.Rectangle();

    for (let chunkY = 0; chunkY < chunksBounds.length; chunkY++) {
      for (let chunkX = 0; chunkX < chunksBounds[chunkY].length; chunkX++) {
        let mapCanvas: CanvasTileChunk = document.createElement("canvas");
        let chunk = (mapCanvas._chunkPosition = chunksBounds[chunkY][chunkX]);

        mapCanvas.isVisible = false;
        mapCanvas.currentPosition = {};

        this.positionCanvasChunk(mapCanvas);

        let canvasWidth = chunk.rightX - chunk.leftX;
        let canvasHeight = chunk.bottomY - chunk.topY;

        mapCanvas.width = canvasWidth;
        mapCanvas.height = canvasHeight;

        // document.body.appendChild(mapCanvas);
        // mapCanvas.style.position = "absolute";
        // mapCanvas.style.zIndex = "-1";

        let leftCanvasPos = chunk.leftX;
        let topCanvasPos = chunk.topY;
        // mapCanvas.style.left = `${leftCanvasPos}px`;
        // mapCanvas.style.top = `${topCanvasPos}px`;

        let extremes = this.isoBoard.getExtremeTilesInRect(
          chunkViewRect.setTo(
            leftCanvasPos,
            topCanvasPos,
            canvasWidth,
            canvasHeight
          )
        );

        let ctx = mapCanvas.getContext("2d");

        // First draw the cliffs, then draw the tiles
        for (let x = extremes.leftmostX; x <= extremes.rightmostX; x++) {
          for (let y = extremes.topmostY; y <= extremes.lowermostY; y++) {
            if (
              !this.mapMatrix[y] ||
              this.mapMatrix[y][x] === CST.ENVIRONMENT.EMPTY_TILE
            ) {
              continue;
            }

            tile = this.preprocessTile(
              x,
              y,
              tile.set3DPosition(x * this.tileHeight, y * this.tileHeight, 0)
            );

            //if a cliff should be drawn underneath this tile
            if (cliffsSparseMatrix[y] && cliffsSparseMatrix[y][x]) {
              let cliff = cliffsSparseMatrix[y][x];

              ctx.drawImage(
                cliff.texture.source[0].image,
                cliff.frame.cutX,
                cliff.frame.cutY,
                cliff.frame.cutWidth,
                cliff.frame.cutHeight,
                tile.x - this.tileWidth / 2 - leftCanvasPos,
                tile.y - this.tileHeight / 2 - topCanvasPos,
                cliff.frame.cutWidth,
                cliff.frame.cutHeight
              );
            }
          }
        }

        for (let x = extremes.leftmostX; x <= extremes.rightmostX; x++) {
          for (let y = extremes.topmostY; y <= extremes.lowermostY; y++) {
            if (
              !this.mapMatrix[y] ||
              this.mapMatrix[y][x] === CST.ENVIRONMENT.EMPTY_TILE
            ) {
              continue;
            }

            tile = this.preprocessTile(
              x,
              y,
              tile.set3DPosition(x * this.tileHeight, y * this.tileHeight, 0)
            );

            let xPos = tile.x - this.tileWidth * tile.originX - leftCanvasPos,
              yPos = tile.y - this.tileHeight * tile.originY - topCanvasPos;

            let scaleX = tile.flipX ? -1 : 1,
              scaleY = tile.flipY ? -1 : 1;

            let xOffset = tile.flipX ? -(xPos + this.tileWidth) : xPos,
              yOffset = tile.flipY ? -(yPos + this.tileHeight) : yPos;

            ctx.save();
            ctx.scale(scaleX, scaleY);

            ctx.drawImage(
              tile.texture.source[0].image,
              tile.frame.cutX,
              tile.frame.cutY,
              tile.frame.cutWidth,
              tile.frame.cutHeight,
              xOffset,
              yOffset,
              this.tileWidth,
              this.tileHeight
            );

            if (scaleX !== 1 || scaleY !== 1) {
              ctx.restore();
            }
          }
        }

        if (!this.mapCanvases[chunkY]) {
          this.mapCanvases[chunkY] = [];
        }

        this.mapCanvases[chunkY][chunkX] = mapCanvas;
      }
    }

    tile.destroy();

    CameraManager.EVENTS.on(CST.CAMERA.MOVE_EVENT, () => this.repositionMap());
    CameraManager.EVENTS.on(CST.CAMERA.ZOOM_EVENT, this.repositionMap);
  }

  // Reposition the map on zoom and map move (the canvas chunks)
  private repositionMap = () => {
    if (this.willReposition) return;

    this.willReposition = true;
    this.scene.events.once("render", () => this.immediateMapReposition());
  };

  private immediateMapReposition(
    actualZoom: number = this.isoBoard.camera.zoom
  ) {
    for (let i = 0; i < this.mapCanvases.length; i++) {
      for (let j = 0; j < this.mapCanvases[i].length; j++) {
        let mapCanvas = this.mapCanvases[i][j];

        let oldWidth =
          mapCanvas._chunkPosition.rightX - mapCanvas._chunkPosition.leftX;
        let oldHeight =
          mapCanvas._chunkPosition.bottomY - mapCanvas._chunkPosition.topY;

        mapCanvas.currentPosition.width = actualZoom * oldWidth;
        mapCanvas.currentPosition.height = actualZoom * oldHeight;

        let leftCanvasPos = mapCanvas._chunkPosition.leftX * actualZoom;
        let topCanvasPos = mapCanvas._chunkPosition.topY * actualZoom;

        // See how the (0, 0) point "stays in place" so
        // we can keep the canvases in place also
        this.isoBoard.camera.getWorldPoint(0, 0, this.originPoint);

        mapCanvas.currentPosition.leftX =
          leftCanvasPos - this.originPoint.x * actualZoom;
        mapCanvas.currentPosition.topY =
          topCanvasPos - this.originPoint.y * actualZoom;
      }
    }

    this.willReposition = false;
    this.checkVisibleChunks();
    this.redrawMap();
  }

  // Determine and show the visible chunks
  // Hide the invisible tiles
  private checkVisibleChunks() {
    let view = this.isoBoard.camera.worldView;

    for (let i = 0; i < this.mapCanvases.length; i++) {
      for (let j = 0; j < this.mapCanvases[i].length; j++) {
        let chunk = this.mapCanvases[i][j]._chunkPosition;

        let canvasWidth = chunk.rightX - chunk.leftX;
        let canvasHeight = chunk.bottomY - chunk.topY;
        let leftCanvasPos = chunk.leftX;
        let topCanvasPos = chunk.topY;

        let chunkViewRect = new Phaser.Geom.Rectangle(
          leftCanvasPos,
          topCanvasPos,
          canvasWidth,
          canvasHeight
        );

        if (Phaser.Geom.Rectangle.Overlaps(view, chunkViewRect)) {
          this.mapCanvases[i][j].isVisible = true;
        } else {
          this.mapCanvases[i][j].isVisible = false;
        }
      }
    }
  }

  // Redraw the offscreen buffered chunks on the map canvas
  private redrawMap() {
    let { width, height } = this.scene.game.scale.canvas;
    this.mapCanvasLayer.width = width;
    this.mapCanvasLayer.height = height;

    let ctx = this.mapCanvasLayer.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < this.mapCanvases.length; i++) {
      for (let j = 0; j < this.mapCanvases[i].length; j++) {
        let bufferedChunk = this.mapCanvases[i][j];

        if (!bufferedChunk.isVisible) {
          continue;
        }

        let { leftX, topY, width, height } = bufferedChunk.currentPosition;

        ctx.drawImage(bufferedChunk, leftX, topY, width, height);
      }
    }
  }

  public onUpdate() {
    let newOrigin = this.isoBoard.camera.getWorldPoint(0, 0);
    if (
      (this.originPoint.x !== newOrigin.x ||
        this.originPoint.y !== newOrigin.y) &&
      !this.willReposition
    ) {
      this.repositionMap();
    }
    // check every update cycle if the viewport moved
    // if so, redraw all tiles
    // if (this.isoBoard.viewRectangleDirty) {
    //   this.redrawTiles();
    // }
  }

  public onTileOver(tileXY: TileXY) {
    let x = tileXY.x,
      y = tileXY.y;

    // don't forget to clear the last tile on tile exit
    this.clearTintedTile(x, y);

    // we are over a valid tile, different than the last tinted one
    if (
      this.mapMatrix[y] &&
      this.mapMatrix[y][x] &&
      (!this.lastTintedTile ||
        this.lastTintedTile.tileX !== x ||
        this.lastTintedTile.tileY !== y)
    ) {
      this.lastTintedTile = new IsoTile(
        this.scene,
        x * this.tileHeight,
        y * this.tileHeight,
        x,
        y,
        this.envManager.getTextureKey()
      )
        .setOrigin(0.5, 0.5)
        .setTint(0x86bfda)
        .setDepth(CST.LAYER_DEPTH.TILES);

      // Add the frame and flip the tile accordingly
      this.preprocessTile(x, y, this.lastTintedTile);
    }
  }

  public clearTintedTile(x?: number, y?: number) {
    // if no (x, y) coords provided just clear the tile
    if (typeof x === "undefined") {
      if (this.lastTintedTile) {
        this.lastTintedTile.destroy();
        this.lastTintedTile = null;

        return;
      }
    }

    if (
      this.lastTintedTile &&
      (this.lastTintedTile.tileX !== x || this.lastTintedTile.tileY !== y)
    ) {
      this.lastTintedTile.destroy();
      this.lastTintedTile = null;
    }
  }

  // this method checks if there is any unused tile in the pool of unused tile
  // otherwise allocates a new one
  // and returns a tile at (x, y) TILE coords
  // getUnusedTile(x: number, y: number): IsoTile {
  //   // get this last tile from the unused pool
  //   let tile: IsoTile = this.unusedPool.pop(),
  //     texture = this.envManager.getTextureKey();

  //   // if no tile is found, create a new one
  //   if (!tile) {
  //     tile = new IsoTile(
  //       this.scene,
  //       x * this.tileHeight,
  //       y * this.tileHeight,
  //       x,
  //       y,
  //       texture
  //     )
  //       .setDepth(CST.LAYER_DEPTH.TILES)
  //       .setActive(false);
  //   }
  //   // an unused tile already exists, reuse this one
  //   else {
  //     tile
  //       .set3DPosition(x * this.tileHeight, y * this.tileHeight, 0)
  //       .setTilePosition(x, y)
  //       .setVisible(true);
  //   }

  //   return this.preprocessTile(x, y, tile);
  // }

  // set the correct frame to the tile and flip it if it's flipped in the game world
  private preprocessTile(x: number, y: number, tile: IsoTile): IsoTile {
    let tileCfg = LayersManager.getInstance().getTileConfig(x, y);

    // what should be the frame of this tile
    let frame = this.envManager.getGrassFrame(tileCfg.id);

    return tile.setFrame(frame).setFlip(tileCfg.flipX, tileCfg.flipY);
  }

  registerToEvents() {
    // when the game resizes, we should reposition all the tiles
    this.scene.scale.on("resize", () => {
      if (this.willRecomputePositions) {
        return;
      }
      this.willRecomputePositions = true;

      this.scene.events.once("render", () => {
        this.recomputeChunkPixelPositions();
        this.willRecomputePositions = false;
        this.repositionMap();
      });
    });
    //{
    // for (let x = 0; x < this.mapWidth; x++) {
    //   for (let y = 0; y < this.mapHeight; y++) {
    //     if (!this.tilesInPlace[y]) {
    //       continue;
    //     }

    //     let usedTile = this.tilesInPlace[y][x];

    //     if (!usedTile) {
    //       continue;
    //     }

    //     usedTile.setVisible(false);

    //     this.unusedPool.push(usedTile);
    //   }
    //}

    //   this.initTilesInPlace();

    //   for (let y in this.cliffsSparseMatrix) {
    //     for (let x in this.cliffsSparseMatrix[y]) {
    //       this.cliffsSparseMatrix[y][x].reset3DPosition();
    //     }
    //   }
    // },
    // this
    //);
  }

  /**
   * Redraw tiles using existing ones, or
   * when there aren't enough tiles in the tileLayerGroup pool of tiles
   * add new ones
   */
  // redrawTiles(): this {
  //   //return;
  //   if (!this.isoBoard.viewRectangleDirty) {
  //     return;
  //   }

  //   let extremes = this.isoBoard.getExtremesTileCoords();

  //   // Keep the intersection between oldView and the newView worth of tiles, discard the difference
  //   if (this.oldView) {
  //     let unusedRects = rectDifference(this.oldView, extremes);

  //     // Remove old rects of unused tiles
  //     for (let rect of unusedRects) {
  //       for (let x = rect.leftmostX; x <= rect.rightmostX; x++) {
  //         for (let y = rect.topmostY; y <= rect.lowermostY; y++) {
  //           if (!this.tilesInPlace[y]) {
  //             continue;
  //           }

  //           let tile = this.tilesInPlace[y][x];

  //           if (!tile) {
  //             continue;
  //           }

  //           this.unusedPool.push(tile);

  //           tile.setVisible(false);

  //           if (this.cliffsSparseMatrix[y] && this.cliffsSparseMatrix[y][x]) {
  //             this.cliffsSparseMatrix[y][x].setVisible(false);
  //           }

  //           this.tilesInPlace[y][x] = null;
  //         }
  //       }
  //     }
  //   }

  //   this.oldView = extremes;

  //   // console.log(extremes);

  //   for (let x = extremes.leftmostX; x <= extremes.rightmostX; x++) {
  //     for (let y = extremes.topmostY; y <= extremes.lowermostY; y++) {
  //       // visibleTiles.forEach(({ x, y }) => {
  //       // there is no tile to be drawn
  //       if (
  //         !this.mapMatrix[y] ||
  //         this.mapMatrix[y][x] === CST.ENVIRONMENT.EMPTY_TILE
  //       ) {
  //         // return;
  //         continue;
  //       }
  //       // also if this tile is already in place, don't reposition it
  //       if (this.tilesInPlace[y][x]) {
  //         // return;
  //         continue;
  //       }

  //       // if a cliff should be drawn underneath this tile
  //       if (this.cliffsSparseMatrix[y] && this.cliffsSparseMatrix[y][x]) {
  //         this.cliffsSparseMatrix[y][x].setVisible(true);
  //       }

  //       // get an unused tile at x, y tile coords
  //       let tile = this.getUnusedTile(x, y);

  //       // push this tile in the pool of used tiles and mark it as being in place
  //       // this.usedPool.push(tile);
  //       this.tilesInPlace[y][x] = tile;
  //     }
  //   }
  //   // );

  //   // redrew tiles, this viewRectangle is not dirty anymore
  //   this.isoBoard.viewRectangleDirty = false;
  //   return this;
  // }

  private generateCliffs(cliffsSparseMatrix: CliffsMatrix) {
    // If the cliff at x, y is hidden by the neigbouring cliffs, don't waste memory
    let hiddenByNeighbours = (x: number, y: number) => {
      let empty = CST.ENVIRONMENT.EMPTY_TILE;
      return (
        this.mapMatrix[y] &&
        this.mapMatrix[y + 1] &&
        this.mapMatrix[y][x + 1] !== empty &&
        this.mapMatrix[y + 1][x] !== empty &&
        this.mapMatrix[y + 1][x + 1] !== empty
      );
    };

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        if (
          this.mapMatrix[y] &&
          this.mapMatrix[y][x] !== CST.ENVIRONMENT.EMPTY_TILE
        ) {
          if (
            (isMargin(x, y, this.mapMatrix) && !hiddenByNeighbours(x, y)) ||
            x === this.mapWidth - 1 ||
            y === this.mapHeight - 1
          ) {
            if (!cliffsSparseMatrix[y]) {
              cliffsSparseMatrix[y] = {};
            }

            // this.cliffsSparseMatrix[y][x] = Phaser.Math.RND.pick(
            //   this.envManager.cliffFrames
            // );

            cliffsSparseMatrix[y][x] = new IsoTile(
              this.scene,
              x * this.tileHeight,
              y * this.tileHeight,
              x,
              y,
              this.envManager.getTextureKey(),
              Phaser.Math.RND.pick(this.envManager.cliffFrames)
            )
              .setDepth(CST.LAYER_DEPTH.CLIFFS)
              .setVisible(false)
              .setActive(false);
          }
        }
      }
    }
  }

  // no tile is in place at first, so init a matrix of false values
  // private initTilesInPlace() {
  //   for (let i = 0; i < this.mapMatrix.length; i++) {
  //     // init this row if it is undefined
  //     this.tilesInPlace[i] || (this.tilesInPlace[i] = []);

  //     for (let j = 0; j < this.mapMatrix[i].length; j++) {
  //       this.tilesInPlace[i][j] = null;
  //     }
  //   }
  // }
}

function* getNeighbours(x: number, y: number): Generator<TileXY> {
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
function isMargin(x: number, y: number, mapGrid: number[][]) {
  for (let tile of getNeighbours(x, y)) {
    if (
      mapGrid[tile.y] &&
      mapGrid[tile.y][tile.x] === CST.ENVIRONMENT.EMPTY_TILE
    ) {
      return true;
    }
  }

  return false;
}

// function createView(
//   leftmostX: number,
//   rightmostX: number,
//   topmostY: number,
//   lowermostY: number
// ): ViewExtremes {
//   return {
//     leftmostX,
//     rightmostX,
//     topmostY,
//     lowermostY
//   };
// }

// Return the difference of two view rectangles
// Code adapted from https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Rectangle_difference
// function rectDifference(
//   oldView: ViewExtremes,
//   newView: ViewExtremes
// ): ViewExtremes[] {
//   let result: ViewExtremes[] = [];

//   // compute the top rectangle
//   let raHeight = newView.topmostY - oldView.topmostY;

//   if (raHeight > 0) {
//     result.push(
//       createView(
//         oldView.leftmostX,
//         oldView.rightmostX,
//         oldView.topmostY,
//         newView.topmostY
//       )
//     );
//   }

//   // compute the bottom rectangle
//   let rbHeight = oldView.lowermostY - newView.lowermostY;

//   if (rbHeight > 0 && newView.lowermostY < oldView.lowermostY) {
//     result.push(
//       createView(
//         oldView.leftmostX,
//         oldView.rightmostX,
//         newView.lowermostY,
//         oldView.lowermostY
//       )
//     );
//   }

//   let y1 =
//     newView.topmostY > oldView.topmostY ? newView.topmostY : oldView.topmostY;
//   let y2 =
//     newView.lowermostY < oldView.lowermostY
//       ? newView.lowermostY
//       : oldView.lowermostY;
//   let rcHeight = y2 - y1;

//   // compute the left rectangle
//   let rcWidth = newView.leftmostX - oldView.leftmostX;

//   if (rcWidth > 0 && rcHeight > 0) {
//     result.push(createView(oldView.leftmostX, newView.leftmostX, y1, y2));
//   }

//   // compute the right rectangle
//   let rdWidth = oldView.rightmostX - newView.rightmostX;

//   if (rdWidth > 0) {
//     result.push(createView(newView.rightmostX, oldView.rightmostX, y1, y2));
//   }

//   return result;
// }
