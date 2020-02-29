import IsoPlugin, { IsoSprite } from "../IsoPlugin/IsoPlugin";

// default debugger class
class Debugger {
  protected scene: Phaser.Scene;
  protected graphics: Phaser.GameObjects.Graphics;
  protected isDebugging: boolean;

  protected readonly LINE_WIDTH = 2;
  protected readonly STROKE_ALPHA = 1;
  protected readonly FILL_ALPHA = 0.4;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = this.scene.add.graphics().setDepth(Infinity);
  }

  enableDebugging(): this {
    this.isDebugging = true;
    return this;
  }

  disableDebugging(): this {
    this.isDebugging = false;

    return this;
  }
}

export class IsoDebugger extends Debugger {
  coordsText: Phaser.GameObjects.Text;
  iso: IsoPlugin;

  constructor(scene: Phaser.Scene, isoInjection: IsoPlugin) {
    super(scene);
    this.iso = isoInjection;
  }

  // show 3D coords of the pointer (unprojected from the screen space), and iso coords
  debugCoords(): this {
    if (!this.isDebugging) {
      return this;
    }

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
    if (!this.isDebugging) {
      return this;
    }

    this.graphics && this.graphics.clear();
    sprites.forEach(sprite => this.debugIsoSprite(sprite, color, filled));

    return this;
  }

  // debug isoSprites should be called even for single sprites with [oneSprite]
  private debugIsoSprite(
    sprite: IsoSprite,
    color: number = 0xccff66,
    filled: boolean = true
  ): this {
    if (!sprite.bounds3D || !this.isDebugging) {
      return this;
    }

    this.graphics.lineStyle(this.LINE_WIDTH, color, this.STROKE_ALPHA);
    this.graphics.fillStyle(color, this.FILL_ALPHA);

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
        var newPos = this.iso.projector.project(p);

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
        return this.iso.projector.project(p);
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

export class NoiseMapDebugger extends Debugger {
  private readonly POINT_SIZE = 10;
  private readonly NOISE_TEXTURE = "_noiseTexture_";

  private noiseMapImage: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    super(scene);

    // the width and height of the game
    let { width, height } = this.scene.game.scale.gameSize;

    this.graphics.setVisible(false);
    this.noiseMapImage = this.scene.add.image(width / 2, height / 2, "");
  }

  showNoiseMap(noiseMap: number[][]) {
    for (let y = 0; y < noiseMap.length; y++) {
      for (let x = 0; x < noiseMap[y].length; x++) {
        // get hex color representation
        let colorField = noiseMap[y][x] * 255;
        let color = (colorField << 16) + (colorField << 8) + colorField;

        this.graphics.fillStyle(color, 1);
        this.graphics.fillPoint(
          x * this.POINT_SIZE,
          y * this.POINT_SIZE,
          this.POINT_SIZE
        );
      }
    }

    this.graphics.generateTexture(this.NOISE_TEXTURE);
    this.noiseMapImage.setTexture(this.NOISE_TEXTURE);
  }
}
