import Phaser from "phaser";
import CST from "../../CST";
import {
  IsoScene,
  Point3,
  Projector,
  ISOMETRIC
} from "../../IsoPlugin/IsoPlugin";
import EnvironmentManager from "../../managers/EnvironmentManager";
import CameraManager from "../../managers/CameraManager";

export enum ArrowDirection {
  NORTH = CST.ARROW_SHAPE.NORTH,
  EAST = CST.ARROW_SHAPE.EAST,
  SOUTH = CST.ARROW_SHAPE.SOUTH,
  WEST = CST.ARROW_SHAPE.WEST
}

let bounds = new Phaser.Geom.Rectangle();

/**
 * Draw an isometric arrow shape
 */
export default class IsoArrow extends Phaser.GameObjects.Polygon {
  TILE_SIZE3D = EnvironmentManager.getInstance().TILE_HEIGHT;
  // the internal scene property will be the UI scene
  scene: IsoScene;
  // the bounds used for the interaction with the arrow
  bounds: Phaser.GameObjects.Rectangle;
  // the offset of the bounds such that it covers the arrow
  boundsOffset: Phaser.Geom.Point;
  // z property for an effect when tapping
  zEffect: number = 0;

  tileX: number = 0;
  tileY: number = 0;

  // remember own direction
  direction: ArrowDirection;

  constructor(
    UIScene: IsoScene,
    gameScene: IsoScene,
    x: number,
    y: number,
    direction: ArrowDirection = ArrowDirection.NORTH,
    fillColor: number = CST.COLORS.YELLOW,
    fillAlpha?: number
  ) {
    super(
      gameScene,
      x,
      y,
      getIsoArrowPoints(gameScene, direction, bounds),
      fillColor,
      fillAlpha
    );

    this.direction = direction;

    gameScene.add.existing(this.setDepth(CST.LAYER_DEPTH.UI));

    this.boundsOffset = new Phaser.Geom.Point(bounds.x, bounds.y);

    this.bounds = gameScene.add
      .rectangle(
        this.x + bounds.x,
        this.y + bounds.y,
        bounds.width,
        bounds.height,
        CST.COLORS.RED,
        0
      )
      .setDepth(CST.LAYER_DEPTH.UI);

    this.bounds
      .setInteractive()
      .on("pointerover", () => {
        this.setFillStyle(CST.COLORS.LIME);
      })
      .on("pointerout", () => {
        this.setFillStyle(fillColor);

        if (this.zEffect !== 0) {
          this.zEffect = 0;
          this.setTilePosition();
        }
      })
      .on("pointerdown", () => {
        this.zEffect = -CST.ARROW_SHAPE.Z_EFFECT;
        this.setTilePosition();

        this.emit(CST.EVENTS.ARROWS_UI.TAP, this);
      })
      .on("pointerup", () => {
        this.zEffect = 0;
        this.setTilePosition();
      });
  }

  public setTilePosition(
    tileX: number = this.tileX,
    tileY: number = this.tileY
  ): this {
    let pt3D = new Point3(
      tileX * this.TILE_SIZE3D,
      tileY * this.TILE_SIZE3D,
      this.zEffect
    );

    this.tileX = tileX;
    this.tileY = tileY;

    let projector = this.scene.iso.projector;

    ({ x: this.x, y: this.y } = projector.project(pt3D));

    this.bounds.x = this.x + this.boundsOffset.x;
    this.bounds.y = this.y + this.boundsOffset.y;

    return this;
  }
}

// compute the points of the arrow in unprojected space then project it
function getIsoArrowPoints(
  scene: IsoScene,
  direction: ArrowDirection,
  bounds: Phaser.Geom.Rectangle
) {
  const AS = CST.ARROW_SHAPE,
    projector = new Projector(scene, ISOMETRIC);

  projector.origin.setTo(0, 0);

  // rotate in the desired direction
  let rotationMatrix = new Phaser.GameObjects.Components.TransformMatrix().rotate(
    direction
  );

  let points = [
    [-AS.BASEW, 0],
    [AS.BASEW, 0],
    [AS.BASEW, -AS.BASEH],
    [AS.BASEW + AS.HEADW, -AS.BASEH],
    [0, -AS.ARROWH],
    [-AS.BASEW - AS.HEADW, -AS.BASEH],
    [-AS.BASEW, -AS.BASEH]
  ].map(([x, y]: [number, number]): [number, number] => {
    let pt = new Phaser.Geom.Point();
    rotationMatrix.transformPoint(x, y, pt);

    let projPt = projector.project(new Point3(pt.x, pt.y));

    return [projPt.x, projPt.y];
  });

  getBounds(points, bounds);

  return points;
}

function getBounds(points: [number, number][], bounds: Phaser.Geom.Rectangle) {
  // the default when the arrow is straight
  let LEFTMOST = 5,
    TOPMOST = 4,
    LOWERMOST = 1,
    RIGHTMOST = 3;
  const X = 0,
    Y = 1;

  let minMax = getMinMaxIndices(points, X);

  LEFTMOST = minMax.min;
  RIGHTMOST = minMax.max;

  minMax = getMinMaxIndices(points, Y);

  TOPMOST = minMax.min;
  LOWERMOST = minMax.max;

  bounds.x = points[LEFTMOST][X];
  bounds.y = points[TOPMOST][Y];
  bounds.width = Math.abs(points[RIGHTMOST][X] - points[LEFTMOST][X]);
  bounds.height = Math.abs(points[LOWERMOST][Y] - points[TOPMOST][Y]);
}

// get the maximum and minimum X or Y of the array
function getMinMaxIndices(
  array: [number, number][],
  property: 0 | 1
): { min: number; max: number } {
  let minIdx = 0,
    maxIdx = 0;

  for (let i = 1; i < array.length; i++) {
    if (array[i][property] > array[maxIdx][property]) {
      maxIdx = i;
    } else if (array[i][property] < array[minIdx][property]) {
      minIdx = i;
    }
  }

  return {
    min: minIdx,
    max: maxIdx
  };
}
