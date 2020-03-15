/*
  MIT License

  Copyright (c) 2018 Rex

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

import TickTask from "phaser3-rex-plugins/plugins/utils/ticktask/TickTask.js";
import GetSceneObject from "phaser3-rex-plugins/plugins/utils/system/GetSceneObject.js";
import MapManager from "../managers/MapManager";

const GetValue = Phaser.Utils.Objects.GetValue;
const DistanceBetween = Phaser.Math.Distance.Between;
const Lerp = Phaser.Math.Linear;
const AngleBetween = Phaser.Math.Angle.Between;

const mapManager = MapManager.getInstance();

class MoveTo extends TickTask {
  constructor(gameObject, config) {
    super(gameObject, config);

    this.gameObject = gameObject;
    this.scene = GetSceneObject(gameObject);

    this.resetFromJSON(config);
    this.boot();
  }

  resetFromJSON(o) {
    this.isRunning = GetValue(o, "isRunning", false);
    this.setEnable(GetValue(o, "enable", true));
    this.timeScale = GetValue(o, "timeScale", 1);
    this.setSpeed(GetValue(o, "speed", 400));
    this.setRotateToTarget(GetValue(o, "rotateToTarget", false));
    this.targetX = GetValue(o, "targetX", 0);
    this.targetY = GetValue(o, "targetY", 0);
    return this;
  }

  toJSON() {
    return {
      isRunning: this.isRunning,
      enable: this.enable,
      timeScale: this.timeScale,
      speed: this.speed,
      rotateToTarget: this.rotateToTarget,
      targetX: this.targetX,
      targetY: this.targetY,
      tickingMode: this.tickingMode
    };
  }

  boot() {
    super.boot();
    if (this.gameObject.once) {
      // oops, bob object does not have event emitter
      this.gameObject.once("destroy", this.destroy, this);
    }
  }

  shutdown() {
    super.shutdown();
    this.gameObject = undefined;
    this.scene = undefined;
  }

  destroy() {
    this.shutdown();
  }

  startTicking() {
    super.startTicking();
    this.scene.events.on("update", this.update, this);
  }

  stopTicking() {
    super.stopTicking();
    if (this.scene) {
      // Scene might be destoryed
      this.scene.events.off("update", this.update, this);
    }
  }

  setEnable(e) {
    if (e == undefined) {
      e = true;
    }
    this.enable = e;
    return this;
  }

  setSpeed(speed) {
    this.speed = speed;
    return this;
  }

  setRotateToTarget(rotateToTarget) {
    this.rotateToTarget = rotateToTarget;
    return this;
  }

  moveTo(x, y) {
    if (typeof x !== "number") {
      var config = x;
      x = GetValue(config, "x", undefined);
      y = GetValue(config, "y", undefined);
    }

    // invalid position
    if (x == null || y == null) {
      return this;
    }

    this.targetX = x;
    this.targetY = y;

    ({
      x: this.worldTargetX,
      y: this.worldTargetY
    } = mapManager.tileToWorldCoords(x, y));

    super.start();
    return this;
  }

  // Converted the update method to use tile coordinates instead of
  // world coordinates, as the isoGame object handles tile coords to world coords internally
  update(time, delta) {
    if (!this.isRunning || !this.enable) {
      return this;
    }

    var gameObject = this.gameObject;
    // the position in TILES the game object has now
    var curX = gameObject.floatingTileX,
      curY = gameObject.floatingTileY;
    // the end position of this moveTo task
    var targetX = this.targetX,
      targetY = this.targetY;

    if (reallyCloseTo(curX, targetX) && reallyCloseTo(curY, targetY)) {
      // round the coords, otherwise the error will keep increasing each time
      // gameObject.setToWorldXY(targetX, targetY, true);

      this.complete();
      return this;
    }

    if (this.speed === 0 || delta === 0 || this.timeScale === 0) {
      return this;
    }

    var dt = (delta * this.timeScale) / 1000;
    var movingDist = this.speed * dt;

    let curWorldX = gameObject.x,
      curWorldY = gameObject.y;

    // only the distance should be computed between real world coordinates
    var distToTarget = DistanceBetween(
      curWorldX,
      curWorldY,
      this.worldTargetX,
      this.worldTargetY
    );

    var newX, newY;

    if (movingDist < distToTarget) {
      var t = movingDist / distToTarget;

      newX = Lerp(curX, targetX, t);
      newY = Lerp(curY, targetY, t);
    } else {
      newX = targetX;
      newY = targetY;
    }

    // debugger;

    // modified for isoGameObjects
    // using tile coordinates
    gameObject.setTilePosition(newX, newY);

    if (this.rotateToTarget) {
      gameObject.rotation = AngleBetween(curX, curY, newX, newY);
    }
    return this;
  }
}

const EPSILON = 0.001;

let reallyCloseTo = function(a, b) {
  if (Math.abs(a - b) <= EPSILON) {
    return true;
  }

  return false;
};

export default MoveTo;
