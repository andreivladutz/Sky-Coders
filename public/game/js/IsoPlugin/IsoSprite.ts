//import Point3 from "./Point3";
//import Cube from "./Cube";
import IsoPlugin, { Point3, Cube } from "./IsoPlugin";

export const ISOSPRITE = "IsoSprite";
const Sprite = Phaser.GameObjects.Sprite;

interface IsoInjectedScene extends Phaser.Scene {
  iso?: IsoPlugin;
}

/**
 * @class IsoSprite
 *
 * @classdesc
 * Create a new `IsoSprite` object. IsoSprites are extended versions of standard Sprites that are suitable for axonometric positioning.
 *
 * IsoSprites are simply Sprites that have three new position properties (isoX, isoY and isoZ) and ask the instance of Projector what their position should be in a 2D scene whenever these properties are changed.
 * The IsoSprites retain their 2D position property to prevent any problems and allow you to interact with them as you would a normal Sprite. The upside of this simplicity is that things should behave predictably for those already used to Phaser.
 */
export default class IsoSprite extends Sprite {
  protected _position3D: Point3;
  protected _position3DChanged: boolean;
  snap: number;
  protected _bounds3DChanged: boolean;
  protected _bounds3D: Cube;

  // projected _bounds3D cube to check pointer hit against
  protected hitPolygon: Phaser.Geom.Polygon;

  // let ts know this scene has an iso property
  scene: IsoInjectedScene;

  // if the depth is set manually via setDepth, then it shouldn't be automatically computed anymore
  private depthOverriden: boolean;

  // TODO: update body to be the Physics' Body type
  body: { [key: string]: any };

  /**
   * @constructor
   * @extends Phaser.GameObjects.Sprite
   * @param {Phaser.Scene} scene - A reference to the current scene.
   * @param {number} x - The x coordinate (in 3D space) to position the IsoSprite at.
   * @param {number} y - The y coordinate (in 3D space) to position the IsoSprite at.
   * @param {number} z - The z coordinate (in 3D space) to position the IsoSprite at.
   * @param {string} texture - This is the image or texture used by the IsoSprite during rendering. It can be a string which is a reference to the Cache entry, or an instance of a RenderTexture or PIXI.Texture.
   * @param {string|number} frame - If this IsoSprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    z: number,
    texture: string,
    frame: string | number
  ) {
    super(scene, x, y, texture, frame);

    /**
     * @property {string} type - The const type of this object.
     * @readonly
     */
    this.type = ISOSPRITE;

    /**
     * @property {Point3} _position3D - Internal 3D position.
     * @private
     */
    this._position3D = new Point3(x, y, z);

    /**
     * @property {number} snap - Snap this IsoSprite's position to the specified value; handy for keeping pixel art snapped to whole pixels.
     * @default
     */
    this.snap = 0;

    /**
     * @property {boolean} _position3DChanged - Internal invalidation control for positioning.
     * @private
     */
    this._position3DChanged = true;

    /**
     * @property {boolean} _bounds3DChanged - Internal invalidation control for isometric bounds.
     * @private
     */
    this._bounds3DChanged = true;

    this._project();

    /**
     * @property {Cube} _bounds3D - Internal derived 3D bounds.
     * @private
     */
    this._bounds3D = this.resetBounds3D();

    this.hitPolygon = this.resetHitArea();
    this.depthOverriden = false;

    // when the game resizes, we should reposition all our sprites on the screen
    this.scene.scale.on(
      "resize",
      () => {
        this._position3DChanged = true;
      },
      this
    );
  }

  /**
   * The axonometric position of the IsoSprite on the x axis. Increasing the x coordinate will move the object down and to the right on the screen.
   *
   * @name IsoSprite#isoX
   * @property {number} isoX - The axonometric position of the IsoSprite on the x axis.
   */
  get isoX(): number {
    return this._position3D.x;
  }

  set isoX(value) {
    this._position3D.x = value;
    this._position3DChanged = this._bounds3DChanged = true;

    if (this.body) {
      this.body._reset = true;
    }
  }

  /**
   * The axonometric position of the IsoSprite on the y axis. Increasing the y coordinate will move the object down and to the left on the screen.
   *
   * @name IsoSprite#isoY
   * @property {number} isoY - The axonometric position of the IsoSprite on the y axis.
   */
  get isoY(): number {
    return this._position3D.y;
  }

  set isoY(value) {
    this._position3D.y = value;
    this._position3DChanged = this._bounds3DChanged = true;

    if (this.body) {
      this.body._reset = true;
    }
  }

  /**
   * The axonometric position of the IsoSprite on the z axis. Increasing the z coordinate will move the object directly upwards on the screen.
   *
   * @name Phaser.Plugin.Isometric.IsoSprite#isoZ
   * @property {number} isoZ - The axonometric position of the IsoSprite on the z axis.
   */
  get isoZ(): number {
    return this._position3D.z;
  }

  set isoZ(value) {
    this._position3D.z = value;
    this._position3DChanged = this._bounds3DChanged = true;

    if (this.body) {
      this.body._reset = true;
    }
  }

  // get screenX() {
  //   return this.x;
  // }

  // get screenY() {
  //   return this.y;
  // }

  // // let the user set the x and y already projected coords directly
  // set screenX(value: number) {
  //   this.x = value;
  //   this.screenPosTo3D();
  // }

  // set screenY(value: number) {
  //   this.y = value;
  //   this.screenPosTo3D();
  // }

  // // set internal 3D position from screen position
  // private screenPosTo3D() {
  //   let projector = this.scene.iso.projector;

  //   this._position3D = projector.unproject(
  //     new Phaser.Geom.Point(this.x, this.y),
  //     this._position3D,
  //     this._position3D ? this._position3D.z : 0
  //   );

  //   // Phaser handles depth sorting automatically
  //   if (!this.depthOverriden) {
  //     this.depth =
  //       this._position3D.x + this._position3D.y + this._position3D.z * 1.25;
  //   }

  //   this._position3DChanged = false;
  //   this._bounds3DChanged = true;
  // }

  /**
   * A Point3 object representing the axonometric position of the IsoSprite.
   *
   * @name Phaser.Plugin.Isometric.IsoSprite#position3D
   * @property {Point3} position3D - The axonometric position of the IsoSprite.
   * @readonly
   */
  get position3D() {
    return this._position3D;
  }

  /**
   * A Cube object representing the derived boundsof the IsoSprite.
   *
   * @name Phaser.Plugin.Isometric.IsoSprite#bounds3D
   * @property {Point3} bounds3D - The derived 3D bounds of the IsoSprite.
   * @readonly
   */
  get bounds3D() {
    if (this._bounds3DChanged || !this._bounds3D) {
      this.resetBounds3D();
      this._bounds3DChanged = false;
    }

    return this._bounds3D;
  }

  setScale(x: number, y?: number): this {
    // the bounds become dirty
    this._bounds3DChanged = true;

    return super.setScale(x, y);
  }

  setOrigin(x?: number, y?: number): this {
    // the bounds become dirty
    this._bounds3DChanged = true;

    return super.setOrigin(x, y);
  }

  setDepth(value?: number): this {
    // if no value is provided, reset the depth
    if (value === undefined) {
      return this.resetDepth();
    }

    this.depthOverriden = true;

    return super.setDepth(value);
  }

  // call this method to return to automatically computing the depth of this sprite
  resetDepth(): this {
    this.depthOverriden = false;
    return this;
  }

  /**
   * Internal function called by the World update cycle.
   *
   * @method IsoSprite#preUpdate
   * @memberof IsoSprite
   */
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    this._project();
  }

  /**
   * Internal function that performs the axonometric projection from 3D to 2D space.
   * @method Phaser.Plugin.Isometric.IsoSprite#_project
   * @memberof Phaser.Plugin.Isometric.IsoSprite
   * @protected
   */
  protected _project() {
    if (!this._position3DChanged) {
      return;
    }

    // const pluginKey = this.scene.sys.settings.map.isoPlugin;
    // const sceneProjector = this.scene[pluginKey].projector;
    const sceneProjector = this.scene.iso.projector;

    let { x, y } = sceneProjector.project(this._position3D);

    this.setX(x);
    this.setY(y);

    // Phaser handles depth sorting automatically
    if (!this.depthOverriden) {
      this.depth =
        this._position3D.x + this._position3D.y + this._position3D.z * 1.25;
    }

    if (this.snap > 0) {
      this.x = Phaser.Math.Snap.To(this.x, this.snap);
      this.y = Phaser.Math.Snap.To(this.y, this.snap);
    }

    this._position3DChanged = false;
    this._bounds3DChanged = true;
  }

  resetBounds3D(): Cube {
    if (typeof this._bounds3D === "undefined") {
      this._bounds3D = new Cube();
    }

    var asx = Math.abs(this.scaleX);
    var asy = Math.abs(this.scaleY);

    this._bounds3D.widthX = Math.round(Math.abs(this.width) * 0.5) * asx;
    this._bounds3D.widthY = Math.round(Math.abs(this.width) * 0.5) * asx;
    this._bounds3D.height =
      Math.round(Math.abs(this.height) - Math.abs(this.width) * 0.5) * asy;

    this._bounds3D.x =
      this.isoX +
      this._bounds3D.widthX * -this.originX +
      this._bounds3D.widthX * 0.5;

    this._bounds3D.y =
      this.isoY +
      this._bounds3D.widthY * this.originX -
      this._bounds3D.widthY * 0.5;

    this._bounds3D.z =
      this.isoZ -
      Math.abs(this.height) * (1 - this.originY) +
      Math.abs(this.width * 0.5);

    return this._bounds3D;
  }

  // recompute the pointer interaction hit area by projecting the bounds3D cube
  resetHitArea(): Phaser.Geom.Polygon {
    const sceneProjector = this.scene.iso.projector,
      // get all the corners of the cube
      corners = this.bounds3D.getCorners(),
      points3D: Point3[] = [
        corners[1],
        corners[3],
        corners[2],
        corners[6],
        corners[4],
        corners[5]
      ],
      pointsIsoProjected: Phaser.Geom.Point[] = points3D.map(function(p) {
        // the bounds of the rectangular sprite (image) in the world
        let rect = this.getBounds(),
          // project the corners of the cube to screen space (isometric coords)
          newPos: Phaser.Geom.Point = sceneProjector.project(p);

        // offset the projected point to (0, 0) screen space
        newPos.x -= rect.x / this.scaleX;
        newPos.y -= rect.y / this.scaleY;

        return newPos;
      }, this);

    return (this.hitPolygon = new Phaser.Geom.Polygon(pointsIsoProjected));
  }

  setInteractive(
    shape?: Phaser.Types.Input.InputConfiguration | any,
    callback?: Phaser.Types.Input.HitAreaCallback,
    dropZone?: boolean
  ): this {
    if (shape !== undefined) {
      return super.setInteractive(shape, callback, dropZone);
    }

    // overwrite the default behaviour
    return super.setInteractive(this.hitPolygon, (poly, x, y) => {
      return Phaser.Geom.Polygon.Contains(poly, x, y);
    });
  }

  // Check if this sprite contains the specified screen space point
  // A z coordinate can be specified for the unprojected 3D point of pt (the default is 0)
  containsScreenPoint(pt: { x: number; y: number }, z: number = 0): boolean {
    let pt3D = this.scene.iso.projector.unproject(pt, new Point3(), z);
    return this.bounds3D.containsXY(pt3D.x, pt3D.y);
  }
}
