import IsoPlugin, { IsoSprite } from "../IsoPlugin/IsoPlugin";

interface IsoInjectedScene extends Phaser.Scene {
  iso?: IsoPlugin;
}

export class IsoDebugger {
  coordsText: Phaser.GameObjects.Text;
  // the scene being debugged
  scene: IsoInjectedScene;
  iso: IsoPlugin;
  graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, isoInjection: IsoPlugin) {
    this.scene = scene;
    this.iso = isoInjection;
  }

  // show 3D coords of the pointer (unprojected from the screen space), and iso coords
  debugCoords(): this {
    this.coordsText = this.scene.add.text(0, 0, "");

    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      let isoPointerLocation = new Phaser.Geom.Point(pointer.x, pointer.y);
      // get the unprojected cooords from isometric(screen) space
      let pointerLocation3D = this.iso.projector.unproject(isoPointerLocation);

      // transform screen coords into board coords
      isoPointerLocation.x =
        isoPointerLocation.x -
        this.iso.projector.origin.x * this.scene.game.scale.gameSize.width;
      isoPointerLocation.y =
        isoPointerLocation.y -
        this.iso.projector.origin.y * this.scene.game.scale.gameSize.height;

      // show coords
      this.coordsText.text = `3DCoords: (x: ${pointerLocation3D.x}, y: ${pointerLocation3D.y})\nisoCoords: (x: ${isoPointerLocation.x}, y: ${isoPointerLocation.y})`;
    });
    return this;
  }

  debugIsoSprites(
    sprites: Array<IsoSprite>,
    color: number = 0xccff66,
    filled: boolean = true
  ): this {
    this.graphics && this.graphics.clear();
    sprites.forEach(sprite => this.debugIsoSprite(sprite, color, filled));

    return this;
  }

  debugIsoSprite(
    sprite: IsoSprite,
    color: number = 0xccff66,
    filled: boolean = true
  ): this {
    if (!sprite.bounds3D) {
      return;
    }
    if (!this.graphics) {
      this.graphics = this.scene.add
        .graphics({
          lineStyle: {
            width: 2,
            alpha: 1,
            color
          },
          fillStyle: {
            alpha: 0.4,
            color
          }
        })
        .setDepth(Infinity);
    }

    var points = [],
      corners = sprite.bounds3D.getCorners();

    if (filled) {
      points = [
        corners[1],
        corners[3],
        corners[2],
        corners[6],
        corners[4],
        corners[5],
        corners[1]
      ];

      points = points.map(function(p) {
        var newPos = this.scene.iso.projector.project(p);

        return newPos;
      }, this);

      this.graphics.beginPath();
      this.graphics.moveTo(points[0].x, points[0].y);

      for (var i = 1; i < points.length; i++) {
        this.graphics.lineTo(points[i].x, points[i].y);
      }
      this.graphics.fill();
    } else {
      points = corners.slice(0, corners.length);
      points = points.map(function(p) {
        return this.scene.iso.projector.project(p);
      }, this);

      this.graphics.moveTo(points[0].x, points[0].y);
      this.graphics.beginPath();

      this.graphics.lineTo(points[1].x, points[1].y);
      this.graphics.lineTo(points[3].x, points[3].y);
      this.graphics.lineTo(points[2].x, points[2].y);
      this.graphics.lineTo(points[6].x, points[6].y);
      this.graphics.lineTo(points[4].x, points[4].y);
      this.graphics.lineTo(points[5].x, points[5].y);
      this.graphics.lineTo(points[1].x, points[1].y);
      this.graphics.lineTo(points[0].x, points[0].y);
      this.graphics.lineTo(points[4].x, points[4].y);
      this.graphics.moveTo(points[0].x, points[0].y);
      this.graphics.lineTo(points[2].x, points[2].y);
      this.graphics.moveTo(points[3].x, points[3].y);
      this.graphics.lineTo(points[7].x, points[7].y);
      this.graphics.lineTo(points[6].x, points[6].y);
      this.graphics.moveTo(points[7].x, points[7].y);
      this.graphics.lineTo(points[5].x, points[5].y);
      this.graphics.stroke();
      this.graphics.closePath();
    }

    return this;
  }
}
