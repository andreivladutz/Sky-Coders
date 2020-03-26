import Phaser from "phaser";
import CST from "../../CST";
import {
  IsoScene,
  Point3,
  Projector,
  ISOMETRIC
} from "../../IsoPlugin/IsoPlugin";
import EnvironmentManager from "../../managers/EnvironmentManager";

export enum ArrowDirection {
  NORTH = CST.ARROW_SHAPE.NORTH,
  EAST = CST.ARROW_SHAPE.EAST,
  SOUTH = CST.ARROW_SHAPE.SOUTH,
  WEST = CST.ARROW_SHAPE.WEST
}

/**
 * Draw an isometric arrow shape
 */
export default class IsoArrow extends Phaser.GameObjects.Polygon {
  TILE_SIZE3D = EnvironmentManager.getInstance().TILE_HEIGHT;
  scene: IsoScene;

  constructor(
    scene: IsoScene,
    x: number,
    y: number,
    direction: ArrowDirection = ArrowDirection.NORTH,
    fillColor: number = CST.COLORS.YELLOW,
    fillAlpha?: number
  ) {
    super(
      scene,
      x,
      y,
      getIsoArrowPoints(scene, direction),
      fillColor,
      fillAlpha
    );

    scene.add.existing(this.setDepth(CST.LAYER_DEPTH.UI));

    this.setInteractive()
      .on("pointerover", () => {
        this.setFillStyle(CST.COLORS.LIME).update();
      })
      .on("pointerout", () => {
        this.setFillStyle(fillColor).update();
      });
  }

  public setTilePosition(tileX: number, tileY: number): this {
    let pt3D = new Point3(
      tileX * this.TILE_SIZE3D,
      tileY * this.TILE_SIZE3D,
      0
    );

    let projector = this.scene.iso.projector;

    ({ x: this.x, y: this.y } = projector.project(pt3D));

    return this;
  }
}

// compute the points of the arrow in unprojected space then project it
function getIsoArrowPoints(scene: IsoScene, direction: ArrowDirection) {
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
  ].map(([x, y]: [number, number]) => {
    let pt = new Phaser.Geom.Point();
    rotationMatrix.transformPoint(x, y, pt);

    let projPt = projector.project(new Point3(pt.x, pt.y));

    return [projPt.x, projPt.y];
  });

  return points;
}
