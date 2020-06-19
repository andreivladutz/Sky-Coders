import IsoSprite from "../IsoPlugin/IsoSprite";
import EnvironmentManager from "../managers/EnvironmentManager";
import MapManager from "../managers/MapManager";
import CST from "../CST";
import { TileXY } from "../map/IsoBoard";
import LayersManager from "../managers/LayersManager";

interface IsoSpriteConfig {
  scene: Phaser.Scene;
  tileX: number;
  tileY: number;
  z?: number;
  objectId: number;
  texture: string;
  frame?: string | number;
  // pass false to this argument to skip applying object to the grid layers
  shouldBeAppliedToLayer?: boolean;
  // override local compute tiles
  localTileX?: number;
  localTileY?: number;
  // optional Tile layering
  tileZ?: number;
}

function isDefinedOrDefault<T>(value: T, typeCheck: string, defaultValue: T) {
  if (typeof value === typeCheck) {
    return value;
  }

  return defaultValue;
}

function applyDefaultValues(config: IsoSpriteConfig) {
  config.shouldBeAppliedToLayer = isDefinedOrDefault(
    config.shouldBeAppliedToLayer,
    "boolean",
    true
  );
  config.localTileY = isDefinedOrDefault(
    config.localTileY,
    "number",
    config.localTileX
  );
  config.tileZ = isDefinedOrDefault(config.tileZ, "number", 0);
  config.z = isDefinedOrDefault(config.z, "number", 0);
}

export enum GridColor {
  DO_NOT_DRAW = -1,
  GREEN = CST.COLORS.GREEN,
  RED = CST.COLORS.RED,
  // Random colors for the actor grid
  ORANGE = 0xff4f00,
  YELLOW = 0xfce205,
  BLUE = 0x51a0d5,
  NEUTRAL_GREEN = 0x59c878,
  PURPLE = 0x8d4585,
  PINK = 0xe51a4c
}

// check if a tile is out of bounds
let outOfBounds = function(
  tile: { x: number; y: number },
  mapGrid: number[][]
) {
  return (
    tile.y < 0 ||
    tile.y >= mapGrid.length ||
    tile.x < 0 ||
    tile.x >= mapGrid[0].length
  );
};

// data added by the rex board plugin
interface RexChess {
  $uid: number;
}

export default class IsoSpriteObject extends IsoSprite {
  // the object id useful for the layer manager
  // this is an identifier for the object type (tree, building..)
  public objectId: number;

  // added to the object by the rex board plugin;
  public rexChess: RexChess;

  tileWidthX: number;
  tileWidthY: number;

  // local tile coords of the origin
  localTileX: number;
  localTileY: number;

  // tells us whether this object has been applied to the layer or not
  isAppliedToLayer: boolean = false;

  // the graphics used to draw this object's grid
  protected gridGraphics: Phaser.GameObjects.Graphics;
  // should we draw the grid? if so this property is a valid number
  protected drawingGridColor: GridColor = GridColor.DO_NOT_DRAW;

  // the tint color of this object when a pointer is over it or it is selected
  protected selectedTintColor: number = CST.ACTOR.SELECTION_TINT;
  // is this object selected?
  selected: boolean = false;

  // This flag should be set if the press event should cancel the selection / deselection event
  protected pressCancelsSelection: boolean = false;
  // Flag to know if the press event has been fired
  private pressWasFired: boolean = false;
  private pressTimeout: any;

  // tile coords of this object
  // CAN BE FLOATING POINT NUMBERS!!!
  protected tileCoords: Phaser.Geom.Point = new Phaser.Geom.Point();

  // the last drew coordinates of the grid
  protected lastDrewTileCoords: Phaser.Geom.Point = new Phaser.Geom.Point();

  mapManager: MapManager = MapManager.getInstance();
  layersManager: LayersManager = LayersManager.getInstance();

  // the size of this tile in 3D (unprojected it is a rectangle)
  readonly TILE_SIZE3D = EnvironmentManager.getInstance().TILE_HEIGHT;

  //@ts-ignore
  constructor(config: IsoSpriteConfig) {
    applyDefaultValues(config);

    super(
      config.scene,
      config.tileX * EnvironmentManager.getInstance().TILE_HEIGHT,
      config.tileY * EnvironmentManager.getInstance().TILE_HEIGHT,
      config.z,
      config.texture,
      config.frame
    );
    this.objectId = config.objectId;

    this.addToGridAt(config.tileX, config.tileY, config.tileZ);

    this.tileCoords.x = config.tileX;
    this.tileCoords.y = config.tileY;

    // add myself to the scene
    // set the origin to default to the bottom right corner
    this.scene.add.existing(this.setOrigin(1, 1));

    this.setOriginByFrame(config.frame);

    this.computeTileArea();
    // override the computed local tiles
    if (typeof config.localTileX === "number") {
      this.overrideLocalTilePos(config.localTileX, config.localTileY);
    }

    if (config.shouldBeAppliedToLayer) {
      this.applyToLayer();
    }

    this.gridGraphics = this.scene.add
      .graphics()
      .setDepth(CST.LAYER_DEPTH.OBJECT_GRID);

    // the actors update on preupdate event, the tilemap updates on update event,
    // as the drawing of the tilemap sets the isoBoard's viewRectangle "not dirty"
    // and that means the grid of the actor will not draw anymore
    this.scene.events.on("preupdate", () => {
      this.onSceneUpdate();
    });

    // determine the grid to redraw on screen resize
    this.scene.scale.on("resize", () => {
      this.lastDrewTileCoords.x = -1;
    });
  }

  public applyToLayer(): this {
    this.layersManager.applyObjectOnLayer(this);

    this.isAppliedToLayer = true;
    return this;
  }

  // this is an uid of the object => generated automatically and is different for every other object
  public getObjectUID(): number {
    return this.rexChess.$uid + 1;
  }

  // Check if the tile coords are contained in this object's grid
  public tileCoordsOnThisGrid(x: number, y: number) {
    for (let { x: tileX, y: tileY } of this.getGridTiles()) {
      if (x === tileX && y === tileY) {
        return true;
      }
    }

    return false;
  }

  // Override the computed local tile coords if they are not computed correctly
  private overrideLocalTilePos(localX: number, localY: number = localX): this {
    this.localTileX = localX;
    this.localTileY = localY;

    return this;
  }

  // make this iso object selectable or unselectable
  // pass false to the enable parameter to deactivate the selectable property
  public makeSelectable(enable: boolean = true): this {
    if (enable === false) {
      this.disableInteractive();
      return this;
    }

    this.setInteractive()
      .on("pointerover", () => {
        // prevent tilemove events propagating to the map
        this.mapManager.events.registerDefaultPrevention(this);

        this.setTint(this.selectedTintColor);
      })
      .on("pointerout", () => {
        this.mapManager.events.unregisterDefaultPrevention();

        if (!this.selected) {
          this.clearTint();
        }
      })
      .on("pointerdown", this.checkPressLogic)
      .on("pointerup", this.handleSelectionToggle);

    return this;
  }

  // Handler function for "pointerdown" event -> checking PRESS
  private checkPressLogic = (pointer: Phaser.Input.Pointer) => {
    // Consider the right mouse button as being a press action
    if (pointer.rightButtonDown()) {
      this.pressWasFired = true;
      this.emit(CST.EVENTS.OBJECT.PRESS, pointer);

      return;
    }

    // Check for press event
    this.pressTimeout = setTimeout(() => {
      if (pointer.isDown) {
        this.pressWasFired = true;
        this.emit(CST.EVENTS.OBJECT.PRESS, pointer);
      }
    }, CST.EVENTS.OBJECT.PRESS_TIME);
  };

  // Handler function for "pointerup" event
  protected handleSelectionToggle = (pointer: Phaser.Input.Pointer) => {
    // If the press event fired and it should cancel selection / deselection
    if (this.pressWasFired && this.pressCancelsSelection) {
      this.pressWasFired = false;

      return;
    }

    // Cancel the listening for press event as this was canceled by this up event
    clearTimeout(this.pressTimeout);
    this.pressWasFired = false;
    this.toggleSelected(pointer);
  };

  // select or deselect the actor
  private toggleSelected(pointer: Phaser.Input.Pointer) {
    if (this.selected) {
      this.deselect(pointer);
    } else {
      this.select(pointer);
    }
  }

  // Provide it as a different function so deselection logic can be overriden in the subclasses
  // The pointer can be omitted if a deselection is fired by the actors manager for example.
  public deselect(pointer?: Phaser.Input.Pointer) {
    this.clearTint();
    this.selected = false;

    this.emit(CST.EVENTS.OBJECT.DESELECT, pointer);
  }

  public select(pointer: Phaser.Input.Pointer) {
    this.selected = true;
    this.setTint(this.selectedTintColor);

    // this object was just selected, emit the event
    this.emit(CST.EVENTS.OBJECT.SELECT, pointer);
  }

  public setSelectedTintColor(color: number): this {
    this.selectedTintColor = color;

    return this;
  }

  // Add this object to the grid at the provided tile coords
  // Added an optional tileZ coord to support layering and prevent the actors from getting bugged
  public addToGridAt(tileX: number, tileY: number, tileZ: number = 0): this {
    this.mapManager.addSpriteObjectToGrid(this, tileX, tileY, tileZ);
    return this;
  }

  // Get the list of tiles composing this object's grid
  // we can specify a certain tile's coords to get the grid around that tile
  public getGridTiles(
    currTileX: number = this.tileX,
    currTileY: number = this.tileY
  ): TileXY[] {
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

  // Get the grid tiles in form of a matrix
  public getGridAsMatrix(): TileXY[][] {
    let gridMatrix = [];

    // how are these tiles positioned relative to the localTileX, localTileY?

    for (let y = 0; y < this.tileWidthY; y++) {
      gridMatrix.push([]);

      for (let x = 0; x < this.tileWidthX; x++) {
        let dX = x - this.localTileX,
          dy = y - this.localTileY;

        gridMatrix[y][x] = { x: this.tileX + dX, y: this.tileY + dy };
      }
    }

    return gridMatrix;
  }

  // Get a padding of tiles around the grid matrix
  public getGridTilePadding(): TileXY[] {
    let padding = [];

    let checkAndPushPadTile = (x: number, y: number) => {
      let dX = x - this.localTileX,
        dy = y - this.localTileY;

      let paddingTile = { x: this.tileX + dX, y: this.tileY + dy };

      if (!this.layersManager.isTileColliding(paddingTile)) {
        padding.push(paddingTile);
      }
    };

    // Pad left and right
    for (let x of [-1, this.tileWidthX]) {
      for (let y = -1; y <= this.tileWidthY; y++) {
        checkAndPushPadTile(x, y);
      }
    }

    // Pad top and bottom
    for (let y of [-1, this.tileWidthY]) {
      for (let x = 0; x < this.tileWidthX; x++) {
        checkAndPushPadTile(x, y);
      }
    }

    return padding;
  }

  // function called on each scene update event
  public onSceneUpdate() {
    this.drawGrid();
  }

  private drawGrid() {
    if (
      this.drawingGridColor === GridColor.DO_NOT_DRAW ||
      (this.lastDrewTileCoords.x === this.tileX &&
        this.lastDrewTileCoords.y === this.tileY)
    ) {
      return;
    }

    let gridTiles = [];

    // Some of the grid padding tiles might end up out of the bounds of the map grid
    for (let tile of this.getGridTiles()) {
      if (!outOfBounds(tile, this.mapManager.mapMatrix)) {
        gridTiles.push(tile);
      }
    }

    this.mapManager
      .getIsoBoard()
      .drawTilesOnGrid(
        gridTiles,
        this.drawingGridColor,
        CST.GRID.LINE_WIDTH,
        CST.GRID.FILL_ALPHA,
        this.drawingGridColor,
        this.gridGraphics.clear()
      );

    // remember the last drewn coords so we don't waste by drawing again and again and again
    this.lastDrewTileCoords.x = this.tileX;
    this.lastDrewTileCoords.y = this.tileY;
  }

  // enable grid drawing
  // acceptable values for color param are red or green hexa color
  enableGridDrawing(color: GridColor) {
    this.drawingGridColor = color;

    // Force grid redraw
    this.lastDrewTileCoords.x = -1;
  }

  disableGridDrawing() {
    this.drawingGridColor = GridColor.DO_NOT_DRAW;

    this.gridGraphics.clear();
  }

  // compute the tile area occupied by this game object
  private computeTileArea() {
    this.tileWidthX = Math.ceil(this.bounds3D.widthX / this.TILE_SIZE3D);
    this.tileWidthY = Math.ceil(this.bounds3D.widthY / this.TILE_SIZE3D);

    this.localTileX = Math.floor(this.tileWidthX * this.originX);
    // localTileY needs the origin with respect to the cube base
    this.localTileY = Math.floor(
      (this.tileWidthY *
        Math.abs(this.originY - this.bounds3D.height / this.height) *
        this.height) /
        this.bounds3D.widthY
    );
  }

  // called internally to get tile coords
  // private computeTileCoords() {
  //   this._project();

  //   ({
  //     x: this.tileCoords.x,
  //     y: this.tileCoords.y
  //   } = this.mapManager.worldToTileCoords(this.x, this.y));
  // }

  get tileX() {
    // this.computeTileCoords();

    return Math.round(this.tileCoords.x);
  }

  get tileY() {
    // this.computeTileCoords();

    return Math.round(this.tileCoords.y);
  }

  // Get tile coords of this Game Object without rounding
  get floatingTileX() {
    return this.tileCoords.x;
  }

  get floatingTileY() {
    return this.tileCoords.y;
  }

  // Get this game's object world coords
  public get worldPosition() {
    return this.mapManager.tileToWorldCoords(this.tileX, this.tileY);
  }

  public setTilePosition(tileX: number, tileY: number): this {
    this.tileCoords.x = tileX;
    this.tileCoords.y = tileY;

    this.isoX = this.tileCoords.x * this.TILE_SIZE3D;
    this.isoY = this.tileCoords.y * this.TILE_SIZE3D;

    return this;
  }

  // move this game object to worldX worldY position
  // we have the choice to round the tile coords, placing the object at integer coords
  public setToWorldXY(
    worldX: number,
    worldY: number,
    roundTileCoords: boolean = false
  ): this {
    const toTileCoords = (roundTileCoords
      ? this.mapManager.worldToTileCoords
      : this.mapManager.worldToFloatTileCoords
    ).bind(this.mapManager);

    let tileCoords = toTileCoords(worldX, worldY);

    return this.setTilePosition(tileCoords.x, tileCoords.y);
  }

  // if body debugging is enabled, the body of this object will be drawn
  public enableDebugging(): this {
    this.mapManager.addToDebuggingObjects(this);

    return this;
  }

  private setOriginByFrame(frame?: string | number) {
    if (!frame) {
      // If no frame has been provided
      for (let frameKey in this.texture.frames) {
        // take the first frame key that's different than base
        // so we can set the origin of this game object correctly
        if (
          frameKey !== "__BASE" &&
          this.texture.frames.hasOwnProperty(frameKey) &&
          this.texture.frames[frameKey].pivotX &&
          this.texture.frames[frameKey].pivotY
        ) {
          this.setOrigin(
            this.texture.frames[frameKey].pivotX,
            this.texture.frames[frameKey].pivotY
          );

          break;
        }
      }
    }
    // Otherwise, use the provided frame's pivot
    else if (
      this.texture.frames.hasOwnProperty(frame) &&
      this.texture.frames[frame].pivotX &&
      this.texture.frames[frame].pivotY
    ) {
      this.setOrigin(
        this.texture.frames[frame].pivotX,
        this.texture.frames[frame].pivotY
      );
    }
  }
}
