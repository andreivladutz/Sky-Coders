import CanMoveToTile from "phaser3-rex-plugins/plugins/board/moveto/CanMoveToTile.js";
import MoveToTile from "./MoveToTile.js";
import MoveToward from "phaser3-rex-plugins/plugins/board/moveto/MoveToward.js";
import MoveToRandomNeighbor from "phaser3-rex-plugins/plugins/board/moveto/MoveToRandomNeighbor.js";
import MoveAway from "phaser3-rex-plugins/plugins/board/moveto/MoveAway.js";
import MoveCloser from "phaser3-rex-plugins/plugins/board/moveto/MoveCloser.js";

export default {
  canMoveTo: CanMoveToTile,
  moveTo: MoveToTile
  // moveToward: MoveToward,
  // moveToRandomNeighbor: MoveToRandomNeighbor,
  // moveAway: MoveAway,
  // moveCloser: MoveCloser
};
