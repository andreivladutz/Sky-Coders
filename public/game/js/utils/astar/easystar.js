/**
 *   EasyStar.js
 *   github.com/prettymuchbryce/EasyStarJS
 *   Licensed under the MIT license.
 *
 *   Implementation By Bryce Neal (@prettymuchbryce)
 **/

var EasyStar = {};
var Instance = require("./instance");
var Node = require("./node");
var Heap = require("./heap");

const CLOSED_LIST = 0;
const OPEN_LIST = 1;

module.exports = EasyStar;

var nextInstanceId = 1;

EasyStar.js = function() {
  var STRAIGHT_COST = 1.0;
  var DIAGONAL_COST = 1.4;
  var syncEnabled = false;
  var pointsToAvoid = {};
  var collisionGrid;
  var costMap = {};
  var pointsToCost = {};
  var directionalConditions = {};
  var allowCornerCutting = true;
  var iterationsSoFar;
  var instances = {};
  var instanceQueue = [];
  var iterationsPerCalculation = Number.MAX_VALUE;
  var acceptableTiles;
  var unacceptableTiles;
  var diagonalsEnabled = false;

  // Added custom canWalkOn callback which can be set
  var canWalkOnCb;
  var canWalkOnCbScope;

  // call this to set custom callback checking if a tile can be walked on
  // the callback's function signature should be:
  // cb(tile: {x, y}): boolean
  this.setCanWalkOnCb = function(cb, cbScope) {
    canWalkOnCb = cb;
    canWalkOnCbScope = cbScope;

    return this;
  };

  /**
   * Sets the collision grid that EasyStar uses.
   *
   * @param {Array|Number} tiles An array of numbers that represent
   * which tiles in your grid should be considered
   * acceptable, or "walkable".
   **/
  this.setAcceptableTiles = function(tiles) {
    if (tiles instanceof Array) {
      // Array
      acceptableTiles = tiles;
    } else if (!isNaN(parseFloat(tiles)) && isFinite(tiles)) {
      // Number
      acceptableTiles = [tiles];
    }

    return this;
  };

  /** 
  @param {Array} tiles An array of numbers that represent
   * which tiles in your grid should be considered
   * unacceptable, or "unwalkable".
   */
  this.setUnacceptableTiles = function(tiles) {
    if (!tiles instanceof Array) {
      throw new Error(
        "The tiles parameter provided to setUnacceptableTiles should be an Array."
      );
    }

    unacceptableTiles = tiles;

    return this;
  };

  this.computeAcceptableTiles = function() {
    if (!acceptableTiles) {
      acceptableTiles = [];
    }

    for (var y = 0; y < collisionGrid.length; y++) {
      for (var x = 0; x < collisionGrid[0].length; x++) {
        let isAcceptableTile = true;
        // Take all unacceptable tiles, if this tile isn't an unacceptable one
        // then it should be added to acceptable tiles list
        for (let tile of unacceptableTiles) {
          if (collisionGrid[y][x] === tile) {
            isAcceptableTile = false;
            break;
          }
        }

        if (isAcceptableTile) {
          acceptableTiles.push(collisionGrid[y][x]);
        }
      }
    }

    return this;
  };

  /**
   * Enables sync mode for this EasyStar instance..
   * if you're into that sort of thing.
   **/
  this.enableSync = function() {
    syncEnabled = true;

    return this;
  };

  /**
   * Disables sync mode for this EasyStar instance.
   **/
  this.disableSync = function() {
    syncEnabled = false;

    return this;
  };

  /**
   * Enable diagonal pathfinding.
   */
  this.enableDiagonals = function() {
    diagonalsEnabled = true;

    return this;
  };

  /**
   * Disable diagonal pathfinding.
   */
  this.disableDiagonals = function() {
    diagonalsEnabled = false;

    return this;
  };

  /**
   * Sets the collision grid that EasyStar uses.
   *
   * @param {Array} grid The collision grid that this EasyStar instance will read from.
   * This should be a 2D Array of Numbers.
   **/
  this.setGrid = function(grid) {
    collisionGrid = grid;

    //Setup cost map
    for (var y = 0; y < collisionGrid.length; y++) {
      for (var x = 0; x < collisionGrid[0].length; x++) {
        if (!costMap[collisionGrid[y][x]]) {
          costMap[collisionGrid[y][x]] = 1;
        }
      }
    }

    return this;
  };

  /**
   * Sets the tile cost for a particular tile type.
   *
   * @param {Number} The tile type to set the cost for.
   * @param {Number} The multiplicative cost associated with the given tile.
   **/
  this.setTileCost = function(tileType, cost) {
    costMap[tileType] = cost;

    return this;
  };

  /**
   * Sets the an additional cost for a particular point.
   * Overrides the cost from setTileCost.
   *
   * @param {Number} x The x value of the point to cost.
   * @param {Number} y The y value of the point to cost.
   * @param {Number} The multiplicative cost associated with the given point.
   **/
  this.setAdditionalPointCost = function(x, y, cost) {
    if (pointsToCost[y] === undefined) {
      pointsToCost[y] = {};
    }
    pointsToCost[y][x] = cost;

    return this;
  };

  /**
   * Remove the additional cost for a particular point.
   *
   * @param {Number} x The x value of the point to stop costing.
   * @param {Number} y The y value of the point to stop costing.
   **/
  this.removeAdditionalPointCost = function(x, y) {
    if (pointsToCost[y] !== undefined) {
      delete pointsToCost[y][x];
    }

    return this;
  };

  /**
   * Remove all additional point costs.
   **/
  this.removeAllAdditionalPointCosts = function() {
    pointsToCost = {};

    return this;
  };

  /**
   * Sets a directional condition on a tile
   *
   * @param {Number} x The x value of the point.
   * @param {Number} y The y value of the point.
   * @param {Array.<String>} allowedDirections A list of all the allowed directions that can access
   * the tile.
   **/
  this.setDirectionalCondition = function(x, y, allowedDirections) {
    if (directionalConditions[y] === undefined) {
      directionalConditions[y] = {};
    }
    directionalConditions[y][x] = allowedDirections;

    return this;
  };

  /**
   * Remove all directional conditions
   **/
  this.removeAllDirectionalConditions = function() {
    directionalConditions = {};

    return this;
  };

  /**
   * Sets the number of search iterations per calculation.
   * A lower number provides a slower result, but more practical if you
   * have a large tile-map and don't want to block your thread while
   * finding a path.
   *
   * @param {Number} iterations The number of searches to prefrom per calculate() call.
   **/
  this.setIterationsPerCalculation = function(iterations) {
    iterationsPerCalculation = iterations;

    return this;
  };

  /**
   * Avoid a particular point on the grid,
   * regardless of whether or not it is an acceptable tile.
   *
   * @param {Number} x The x value of the point to avoid.
   * @param {Number} y The y value of the point to avoid.
   **/
  this.avoidAdditionalPoint = function(x, y) {
    if (pointsToAvoid[y] === undefined) {
      pointsToAvoid[y] = {};
    }
    pointsToAvoid[y][x] = 1;

    return this;
  };

  /**
   * Stop avoiding a particular point on the grid.
   *
   * @param {Number} x The x value of the point to stop avoiding.
   * @param {Number} y The y value of the point to stop avoiding.
   **/
  this.stopAvoidingAdditionalPoint = function(x, y) {
    if (pointsToAvoid[y] !== undefined) {
      delete pointsToAvoid[y][x];
    }

    return this;
  };

  /**
   * Enables corner cutting in diagonal movement.
   **/
  this.enableCornerCutting = function() {
    allowCornerCutting = true;

    return this;
  };

  /**
   * Disables corner cutting in diagonal movement.
   **/
  this.disableCornerCutting = function() {
    allowCornerCutting = false;

    return this;
  };

  /**
   * Stop avoiding all additional points on the grid.
   **/
  this.stopAvoidingAllAdditionalPoints = function() {
    pointsToAvoid = {};

    return this;
  };

  /**
   * Find a path.
   *
   * @param {Number} startX The X position of the starting point.
   * @param {Number} startY The Y position of the starting point.
   * @param {Number} endX The X position of the ending point.
   * @param {Number} endY The Y position of the ending point.
   * @param {Function} callback A function that is called when your path
   * is found, or no path is found.
   * @return {Number} A numeric, non-zero value which identifies the created instance. This value can be passed to cancelPath to cancel the path calculation.
   *
   **/
  this.findPath = function(startX, startY, endX, endY, callback) {
    // Wraps the callback for sync vs async logic
    var callbackWrapper = function(result) {
      if (syncEnabled) {
        callback(result);
      } else {
        setTimeout(function() {
          callback(result);
        });
      }
    };

    // No grid was set
    if (collisionGrid === undefined) {
      throw new Error(
        "You can't set a path without first calling setGrid() on EasyStar."
      );
    }

    // No acceptable tiles were set
    if (acceptableTiles === undefined) {
      if (unacceptableTiles !== undefined) {
        this.computeAcceptableTiles();
      } else {
        throw new Error(
          "You can't set a path without first calling setAcceptableTiles() on EasyStar."
        );
      }
    }

    // Start or endpoint outside of scope.
    if (
      startX < 0 ||
      startY < 0 ||
      endX < 0 ||
      endY < 0 ||
      startX > collisionGrid[0].length - 1 ||
      startY > collisionGrid.length - 1 ||
      endX > collisionGrid[0].length - 1 ||
      endY > collisionGrid.length - 1
    ) {
      throw new Error(
        "Your start or end point is outside the scope of your grid."
      );
    }

    // Start and end are the same tile.
    if (startX === endX && startY === endY) {
      callbackWrapper([]);
      return;
    }

    // End point is not an acceptable tile.
    var endTile = collisionGrid[endY][endX];
    var isAcceptable = false;
    for (var i = 0; i < acceptableTiles.length; i++) {
      if (endTile === acceptableTiles[i]) {
        isAcceptable = true;
        break;
      }
    }

    if (isAcceptable === false) {
      callbackWrapper(null);
      return;
    }

    // Also if a canWalkOn callback is provided, check the end tile against that
    if (!checkCustomWalkable(endX, endY)) {
      callbackWrapper(null);
      return;
    }

    // Create the instance
    var instance = new Instance();
    instance.openList = new Heap(function(nodeA, nodeB) {
      return nodeA.bestGuessDistance() - nodeB.bestGuessDistance();
    });
    instance.isDoneCalculating = false;
    instance.nodeHash = {};
    instance.startX = startX;
    instance.startY = startY;
    instance.endX = endX;
    instance.endY = endY;
    instance.callback = callbackWrapper;

    instance.openList.push(
      coordinateToNode(
        instance,
        instance.startX,
        instance.startY,
        null,
        STRAIGHT_COST
      )
    );

    var instanceId = nextInstanceId++;
    instances[instanceId] = instance;
    instanceQueue.push(instanceId);
    return instanceId;
  };

  /**
   * Cancel a path calculation.
   *
   * @param {Number} instanceId The instance ID of the path being calculated
   * @return {Boolean} True if an instance was found and cancelled.
   *
   **/
  this.cancelPath = function(instanceId) {
    if (instanceId in instances) {
      delete instances[instanceId];
      // No need to remove it from instanceQueue
      return true;
    }
    return false;
  };

  /**
   * This method steps through the A* Algorithm in an attempt to
   * find your path(s). It will search 4-8 tiles (depending on diagonals) for every calculation.
   * You can change the number of calculations done in a call by using
   * easystar.setIteratonsPerCalculation().
   **/
  this.calculate = function() {
    if (
      instanceQueue.length === 0 ||
      collisionGrid === undefined ||
      acceptableTiles === undefined
    ) {
      return;
    }
    for (
      iterationsSoFar = 0;
      iterationsSoFar < iterationsPerCalculation;
      iterationsSoFar++
    ) {
      if (instanceQueue.length === 0) {
        return;
      }

      if (syncEnabled) {
        // If this is a sync instance, we want to make sure that it calculates synchronously.
        iterationsSoFar = 0;
      }

      var instanceId = instanceQueue[0];
      var instance = instances[instanceId];
      if (typeof instance == "undefined") {
        // This instance was cancelled
        instanceQueue.shift();
        continue;
      }

      // Couldn't find a path.
      if (instance.openList.size() === 0) {
        instance.callback(null);
        delete instances[instanceId];
        instanceQueue.shift();
        continue;
      }

      var searchNode = instance.openList.pop();

      // Handles the case where we have found the destination
      if (instance.endX === searchNode.x && instance.endY === searchNode.y) {
        var path = [];
        path.push({ x: searchNode.x, y: searchNode.y });
        var parent = searchNode.parent;
        while (parent != null) {
          path.push({ x: parent.x, y: parent.y });
          parent = parent.parent;
        }
        path.reverse();
        var ip = path;
        instance.callback(ip);
        delete instances[instanceId];
        instanceQueue.shift();
        continue;
      }

      searchNode.list = CLOSED_LIST;

      if (searchNode.y > 0) {
        checkAdjacentNode(
          instance,
          searchNode,
          0,
          -1,
          STRAIGHT_COST * getTileCost(searchNode.x, searchNode.y - 1)
        );
      }
      if (searchNode.x < collisionGrid[0].length - 1) {
        checkAdjacentNode(
          instance,
          searchNode,
          1,
          0,
          STRAIGHT_COST * getTileCost(searchNode.x + 1, searchNode.y)
        );
      }
      if (searchNode.y < collisionGrid.length - 1) {
        checkAdjacentNode(
          instance,
          searchNode,
          0,
          1,
          STRAIGHT_COST * getTileCost(searchNode.x, searchNode.y + 1)
        );
      }
      if (searchNode.x > 0) {
        checkAdjacentNode(
          instance,
          searchNode,
          -1,
          0,
          STRAIGHT_COST * getTileCost(searchNode.x - 1, searchNode.y)
        );
      }
      if (diagonalsEnabled) {
        if (searchNode.x > 0 && searchNode.y > 0) {
          if (
            allowCornerCutting ||
            (isTileWalkable(
              collisionGrid,
              acceptableTiles,
              searchNode.x,
              searchNode.y - 1,
              searchNode
            ) &&
              isTileWalkable(
                collisionGrid,
                acceptableTiles,
                searchNode.x - 1,
                searchNode.y,
                searchNode
              ))
          ) {
            checkAdjacentNode(
              instance,
              searchNode,
              -1,
              -1,
              DIAGONAL_COST * getTileCost(searchNode.x - 1, searchNode.y - 1)
            );
          }
        }
        if (
          searchNode.x < collisionGrid[0].length - 1 &&
          searchNode.y < collisionGrid.length - 1
        ) {
          if (
            allowCornerCutting ||
            (isTileWalkable(
              collisionGrid,
              acceptableTiles,
              searchNode.x,
              searchNode.y + 1,
              searchNode
            ) &&
              isTileWalkable(
                collisionGrid,
                acceptableTiles,
                searchNode.x + 1,
                searchNode.y,
                searchNode
              ))
          ) {
            checkAdjacentNode(
              instance,
              searchNode,
              1,
              1,
              DIAGONAL_COST * getTileCost(searchNode.x + 1, searchNode.y + 1)
            );
          }
        }
        if (searchNode.x < collisionGrid[0].length - 1 && searchNode.y > 0) {
          if (
            allowCornerCutting ||
            (isTileWalkable(
              collisionGrid,
              acceptableTiles,
              searchNode.x,
              searchNode.y - 1,
              searchNode
            ) &&
              isTileWalkable(
                collisionGrid,
                acceptableTiles,
                searchNode.x + 1,
                searchNode.y,
                searchNode
              ))
          ) {
            checkAdjacentNode(
              instance,
              searchNode,
              1,
              -1,
              DIAGONAL_COST * getTileCost(searchNode.x + 1, searchNode.y - 1)
            );
          }
        }
        if (searchNode.x > 0 && searchNode.y < collisionGrid.length - 1) {
          if (
            allowCornerCutting ||
            (isTileWalkable(
              collisionGrid,
              acceptableTiles,
              searchNode.x,
              searchNode.y + 1,
              searchNode
            ) &&
              isTileWalkable(
                collisionGrid,
                acceptableTiles,
                searchNode.x - 1,
                searchNode.y,
                searchNode
              ))
          ) {
            checkAdjacentNode(
              instance,
              searchNode,
              -1,
              1,
              DIAGONAL_COST * getTileCost(searchNode.x - 1, searchNode.y + 1)
            );
          }
        }
      }
    }
  };

  // Private methods follow
  var checkAdjacentNode = function(instance, searchNode, x, y, cost) {
    var adjacentCoordinateX = searchNode.x + x;
    var adjacentCoordinateY = searchNode.y + y;

    if (
      (pointsToAvoid[adjacentCoordinateY] === undefined ||
        pointsToAvoid[adjacentCoordinateY][adjacentCoordinateX] ===
          undefined) &&
      isTileWalkable(
        collisionGrid,
        acceptableTiles,
        adjacentCoordinateX,
        adjacentCoordinateY,
        searchNode
      )
    ) {
      // custom logic for checking if a tile is walkable
      // useful for example for game objects larger than one tile
      if (!checkCustomWalkable(adjacentCoordinateX, adjacentCoordinateY)) {
        return;
      }

      var node = coordinateToNode(
        instance,
        adjacentCoordinateX,
        adjacentCoordinateY,
        searchNode,
        cost
      );

      if (node.list === undefined) {
        node.list = OPEN_LIST;
        instance.openList.push(node);
      } else if (searchNode.costSoFar + cost < node.costSoFar) {
        node.costSoFar = searchNode.costSoFar + cost;
        node.parent = searchNode;
        instance.openList.updateItem(node);
      }
    }
  };

  // Helpers
  var isTileWalkable = function(
    collisionGrid,
    acceptableTiles,
    x,
    y,
    sourceNode
  ) {
    var directionalCondition =
      directionalConditions[y] && directionalConditions[y][x];
    if (directionalCondition) {
      var direction = calculateDirection(sourceNode.x - x, sourceNode.y - y);
      var directionIncluded = function() {
        for (var i = 0; i < directionalCondition.length; i++) {
          if (directionalCondition[i] === direction) return true;
        }
        return false;
      };
      if (!directionIncluded()) return false;
    }
    for (var i = 0; i < acceptableTiles.length; i++) {
      if (collisionGrid[y][x] === acceptableTiles[i]) {
        return true;
      }
    }

    return false;
  };

  var checkCustomWalkable = function(tileX, tileY) {
    // no callback has been probided
    if (!canWalkOnCb) {
      return true;
    }

    let currTile = { x: tileX, y: tileY },
      isWalkable = false;

    if (canWalkOnCbScope) {
      isWalkable = canWalkOnCb.call(canWalkOnCbScope, currTile);
    } else {
      isWalkable = canWalkOnCb(currTile);
    }

    return isWalkable;
  };

  /**
   * -1, -1 | 0, -1  | 1, -1
   * -1,  0 | SOURCE | 1,  0
   * -1,  1 | 0,  1  | 1,  1
   */
  var calculateDirection = function(diffX, diffY) {
    if (diffX === 0 && diffY === -1) return EasyStar.TOP;
    else if (diffX === 1 && diffY === -1) return EasyStar.TOP_RIGHT;
    else if (diffX === 1 && diffY === 0) return EasyStar.RIGHT;
    else if (diffX === 1 && diffY === 1) return EasyStar.BOTTOM_RIGHT;
    else if (diffX === 0 && diffY === 1) return EasyStar.BOTTOM;
    else if (diffX === -1 && diffY === 1) return EasyStar.BOTTOM_LEFT;
    else if (diffX === -1 && diffY === 0) return EasyStar.LEFT;
    else if (diffX === -1 && diffY === -1) return EasyStar.TOP_LEFT;
    throw new Error("These differences are not valid: " + diffX + ", " + diffY);
  };

  var getTileCost = function(x, y) {
    return (
      (pointsToCost[y] && pointsToCost[y][x]) || costMap[collisionGrid[y][x]]
    );
  };

  var coordinateToNode = function(instance, x, y, parent, cost) {
    if (instance.nodeHash[y] !== undefined) {
      if (instance.nodeHash[y][x] !== undefined) {
        return instance.nodeHash[y][x];
      }
    } else {
      instance.nodeHash[y] = {};
    }
    var simpleDistanceToTarget = getDistance(
      x,
      y,
      instance.endX,
      instance.endY
    );
    if (parent !== null) {
      var costSoFar = parent.costSoFar + cost;
    } else {
      costSoFar = 0;
    }
    var node = new Node(parent, x, y, costSoFar, simpleDistanceToTarget);
    instance.nodeHash[y][x] = node;
    return node;
  };

  var getDistance = function(x1, y1, x2, y2) {
    if (diagonalsEnabled) {
      // Octile distance
      var dx = Math.abs(x1 - x2);
      var dy = Math.abs(y1 - y2);
      if (dx < dy) {
        return DIAGONAL_COST * dx + dy;
      } else {
        return DIAGONAL_COST * dy + dx;
      }
    } else {
      // Manhattan distance
      var dx = Math.abs(x1 - x2);
      var dy = Math.abs(y1 - y2);
      return dx + dy;
    }
  };
};

EasyStar.TOP = "TOP";
EasyStar.TOP_RIGHT = "TOP_RIGHT";
EasyStar.RIGHT = "RIGHT";
EasyStar.BOTTOM_RIGHT = "BOTTOM_RIGHT";
EasyStar.BOTTOM = "BOTTOM";
EasyStar.BOTTOM_LEFT = "BOTTOM_LEFT";
EasyStar.LEFT = "LEFT";
EasyStar.TOP_LEFT = "TOP_LEFT";
