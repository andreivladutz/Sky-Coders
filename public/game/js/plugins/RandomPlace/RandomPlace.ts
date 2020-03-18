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

import GetDefaultBounds from "phaser3-rex-plugins/plugins/utils/defaultbounds/GetDefaultBounds.js";

const GetValue = Phaser.Utils.Objects.GetValue;
const IsPlainObject = Phaser.Utils.Objects.IsPlainObject;
const Circle = Phaser.Geom.Circle;
const CircleToCircle = Phaser.Geom.Intersects.CircleToCircle;

// Search for a random position for this milliseconds
// if it doesn't find a position, quit searching
const MAX_TIME_SEARCHING = 100;

interface GameObjectLike {
  x: number;
  y: number;

  setPosition: (x: number, y: number) => any;
}

interface GameObjectConfig {
  gameObject: GameObjectLike;
  radius: number;
}

export default function RandomPlace(
  items: GameObjectLike[] | GameObjectConfig[],
  options
) {
  if (items.length === 0) {
    return items;
  }

  var getPositionCallback = GetValue(options, "getPositionCallback", undefined);
  if (getPositionCallback === undefined) {
    var area = GetValue(options, "area", undefined);
    if (area === undefined) {
      var item0 = items[0],
        gameObject;

      if (IsPlainObject(item0)) {
        // item0 is surely a gameObject
        gameObject = (item0 as GameObjectConfig).gameObject;
      } else {
        gameObject = item0;
      }
      area = GetDefaultBounds(gameObject.scene);
    }
    getPositionCallback = area.getRandomPoint.bind(area);
  }
  var defaultRadius = GetValue(options, "radius", 0);

  var item, gameObject, radius;
  var collisionCircles = [];
  for (var i = 0, cnt = items.length; i < cnt; i++) {
    item = items[i];
    if (IsPlainObject(item)) {
      gameObject = GetValue(item, "gameObject", undefined);
      radius = GetValue(item, "radius", defaultRadius);
    } else {
      gameObject = item;
      radius = defaultRadius;
    }

    if (!gameObject) {
      continue;
    }

    if (radius <= 0) {
      getPositionCallback(gameObject);
    } else {
      var circle = new Circle(0, 0, radius);
      let isOverlapping: boolean;

      let startTime = Date.now();

      do {
        if (Date.now() - startTime >= MAX_TIME_SEARCHING) {
          return items;
        }

        getPositionCallback(circle);
        isOverlapping = false;
        for (var ci = 0, ccnt = collisionCircles.length; ci < ccnt; ci++) {
          isOverlapping = CircleToCircle(circle, collisionCircles[ci]);
          if (isOverlapping) {
            break;
          }
        }
      } while (isOverlapping);

      collisionCircles.push(circle);
      gameObject.setPosition(circle.x, circle.y);
    }
  }

  return items;
}
