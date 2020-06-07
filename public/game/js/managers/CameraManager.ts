import Phaser from "phaser";
import { Pan, Pinch } from "phaser3-rex-plugins/plugins/gestures";

import Manager from "./Manager";
import CST from "../CST";
import MapManager from "./MapManager";

type Camera = Phaser.Cameras.Scene2D.Camera;

interface CameraControlConfig {
  camera: Camera;
  scene: Phaser.Scene;

  enablePan: boolean;
  enableZoom: boolean;
}

export default class CameraManager extends Manager {
  camera: Camera;
  // the scene this camera belongs to
  scene: Phaser.Scene;

  // utility for camera panning
  pan: Pan;
  // utility for camera zooming
  pinch: Pinch;

  public static readonly EVENTS = new Phaser.Events.EventEmitter();

  private window: Phaser.GameObjects.Zone;

  protected constructor(config: CameraControlConfig) {
    super();

    this.camera = config.camera;
    this.scene = config.scene;

    if (config.enablePan) {
      this.enablePan();
    }
    if (config.enableZoom) {
      this.enableZoom();
    }
  }

  getViewRect(): Phaser.Geom.Rectangle {
    return this.camera.worldView;
  }

  // center the camera view on these coords
  centerOn(scrollX: number, scrollY: number): this {
    if (this.window) {
      this.window.x = scrollX;
      this.window.y = scrollY;
    } else {
      let { width, height } = this.camera.worldView;

      this.camera.setScroll(scrollX - width / 2, scrollY - height / 2);
    }

    setTimeout(() => CameraManager.EVENTS.emit(CST.CAMERA.MOVE_EVENT), 0);

    return this;
  }

  // get the world coords that this camera is currently focused on
  getWorldPointAtCenter(): { x: number; y: number } {
    let view = this.camera.worldView;

    return {
      x: view.x + view.width / 2,
      y: view.y + view.height / 2
    };
  }

  enablePan(): this {
    let { width, height } = this.scene.game.scale.gameSize;

    // add a hidden object the size of the window which will be moved
    // while panning. the camera will follow to object to simulate camera pan
    this.window = this.scene.add
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
        const mapManager = MapManager.getInstance();

        // limit the panning to the map's size
        let {
            leftmostX,
            rightmostX,
            topmostY,
            lowermostY
          } = mapManager.getExtremesTileCoords(),
          { w, h } = mapManager.getMapTilesize();

        let panlimit = (1 / this.camera.zoom) * CST.CAMERA.PANLIMIT_RATIO;

        if (pan.dx > 0 && rightmostX <= panlimit) {
          pan.dx = 0;
        } else if (pan.dx < 0 && leftmostX >= w - panlimit) {
          pan.dx = 0;
        }

        if (pan.dy > 0 && lowermostY <= panlimit) {
          pan.dy = 0;
        } else if (pan.dx < 0 && topmostY >= h - panlimit) {
          pan.dy = 0;
        }

        let dx = pan.dx / this.camera.zoom;
        let dy = pan.dy / this.camera.zoom;

        // using the inverse of the zoom so when the camera is zoomed out
        // the player can pan the camera faster
        this.window.x -= dx;
        this.window.y -= dy;

        CameraManager.EVENTS.emit(
          CST.CAMERA.MOVE_EVENT,
          dx,
          dy,
          pan.dx,
          pan.dy
        );
      },
      this
    );

    this.camera.startFollow(
      this.window,
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
      CameraManager.EVENTS.emit(
        CST.CAMERA.ZOOM_EVENT,
        actualZoomFactor,
        this.camera.zoom
      );
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

  public static getInstance(config?: CameraControlConfig): CameraManager {
    if (!this._instance && !config) {
      throw new Error(
        "A configuration object should be provided to initialise the CameraManager."
      );
    }

    return super.getInstance(config) as CameraManager;
  }
}
