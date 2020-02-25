import Phaser from "phaser";
import { Pan, Pinch } from "phaser3-rex-plugins/plugins/gestures";
import CST from "../CST";

type Camera = Phaser.Cameras.Scene2D.Camera;

interface CameraControlConfig {
  enablePan: boolean;
  enableZoom: boolean;
}

export default class CameraController {
  camera: Camera;
  // the scene this camera belongs to
  scene: Phaser.Scene;

  // utility for camera panning
  pan: Pan;
  // utility for camera zooming
  pinch: Pinch;

  constructor(
    camera: Camera,
    scene: Phaser.Scene,
    config: CameraControlConfig
  ) {
    this.camera = camera;
    this.scene = scene;

    if (config.enablePan) {
      this.enablePan();
    }
    if (config.enableZoom) {
      this.enableZoom();
    }
  }

  enablePan(): this {
    let { width, height } = this.scene.game.scale.gameSize;

    // add a hidden object the size of the window which will be moved
    // while panning. the camera will follow to object to simulate camera pan
    let window = this.scene.add
      .zone(width / 2, height / 2, width, height)
      .setVisible(false)
      .setOrigin(0.5);

    // init the plugin object
    this.pan = new Pan(this.scene, {
      enable: true,
      threshold: CST.CAMERA.PAN_THRESHOLD
    });

    this.pan.on(
      "pan",
      (pan: Pan) => {
        window.x -= pan.dx;
        window.y -= pan.dy;
      },
      this
    );

    // this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
    //   if (!pointer.isDown) {
    //     return;
    //   }
    //   window.x -= ((pointer.x - pointer.downX) / width) * 150;
    //   window.y -= ((pointer.y - pointer.downY) / height) * 150;
    // });

    this.camera.startFollow(
      window,
      false,
      CST.CAMERA.PAN_LERP,
      CST.CAMERA.PAN_LERP
    );

    return this;
  }

  enableZoom(): this {
    // enable zoom by pinching on touch devices
    this.pinch = new Pinch(this.scene, {
      enable: true
    });

    this.pinch.on(
      "pinch",
      (pinch: Pinch) => {
        this.camera.zoom *= pinch.scaleFactor;

        this.camera.zoom = Phaser.Math.Clamp(
          this.camera.zoom,
          CST.CAMERA.MIN_ZOOM,
          CST.CAMERA.MAX_ZOOM
        );
      },
      this
    );

    // enable zoom by scrolling on a device with a mouse input
    this.scene.input.on("wheel", (pointer, currentlyOver, dx, dy) => {
      // scrolling down
      if (dy > 0) {
        this.camera.zoom *= CST.CAMERA.ZOOM_FACTOR;
      }
      // scrolling up
      if (dy < 0) {
        this.camera.zoom *= 1 / CST.CAMERA.ZOOM_FACTOR;
      }

      this.camera.zoom = Phaser.Math.Clamp(
        this.camera.zoom,
        CST.CAMERA.MIN_ZOOM,
        CST.CAMERA.MAX_ZOOM
      );
    });
    return this;
  }
}
