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

  // are we taking a break from emitting the move event?
  debouncingMoveEvent: boolean = false;

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
        // using the inverse of the zoom so when the camera is zoomed out
        // the player can pan the camera faster
        window.x -= (pan.dx * 1) / this.camera.zoom;
        window.y -= (pan.dy * 1) / this.camera.zoom;

        if (this.debouncingMoveEvent) {
          return;
        }

        this.debouncingMoveEvent = true;
        this.camera.emit(CST.CAMERA.MOVE_EVENT);

        // after debounce time, deactivate the debounce so we can emit the move event again
        setTimeout(
          self => {
            self.debouncingMoveEvent = false;
          },
          CST.CAMERA.MOVE_EVENT_DEBOUNCE,
          this
        );
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

    // made a function so code doesn't get dupplicated
    let zoomCamera = (zoomFactor: number) => {
      let oldZoom = this.camera.zoom;
      this.camera.setZoom(this.camera.zoom * zoomFactor);

      // don't let the zoom exceed this values
      this.camera.setZoom(
        Phaser.Math.Clamp(
          this.camera.zoom,
          CST.CAMERA.MIN_ZOOM,
          CST.CAMERA.MAX_ZOOM
        )
      );

      // emit the camera zoom event with the actual zoom factor the camera scaled
      let actualZoomFactor = this.camera.zoom / oldZoom;
      this.camera.emit(CST.CAMERA.ZOOM_EVENT, actualZoomFactor);
    };

    this.pinch.on(
      "pinch",
      (pinch: Pinch) => {
        zoomCamera(pinch.scaleFactor);
      },
      this
    );

    // enable zoom by scrolling on a device with a mouse input
    this.scene.input.on("wheel", (pointer, currentlyOver, dx, dy) => {
      // scrolling down
      if (dy > 0) {
        zoomCamera(CST.CAMERA.ZOOM_FACTOR);
      }
      // scrolling up
      if (dy < 0) {
        zoomCamera(1 / CST.CAMERA.ZOOM_FACTOR);
      }
    });
    return this;
  }
}
