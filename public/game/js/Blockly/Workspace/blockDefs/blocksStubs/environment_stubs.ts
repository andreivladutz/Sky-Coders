import { Block } from "blockly";
import { removeIdentation } from "../codeUtils";

// Possible neighbour directions of a tile coordinate
// in get_neighbour block function
enum NEIGHBOUR_DIR {
  UP = "UP",
  DOWN = "DOWN",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  UPLEFT = "UPLEFT",
  UPRIGHT = "UPRIGHT",
  DOWNLEFT = "DOWNLEFT",
  DOWNRIGHT = "DOWNRIGHT"
}

type Coord = {
  x: number;
  y: number;
};

function getCoordinateNeighbour(direction: NEIGHBOUR_DIR): Coord {
  switch (direction) {
    case NEIGHBOUR_DIR.DOWN:
      return { x: 0, y: 1 };
    case NEIGHBOUR_DIR.UP:
      return { x: 0, y: -1 };
    case NEIGHBOUR_DIR.LEFT:
      return { x: -1, y: 0 };
    case NEIGHBOUR_DIR.RIGHT:
      return { x: 1, y: 0 };
    case NEIGHBOUR_DIR.UPRIGHT:
      return { x: 1, y: -1 };
    case NEIGHBOUR_DIR.UPLEFT:
      return { x: -1, y: -1 };
    case NEIGHBOUR_DIR.DOWNRIGHT:
      return { x: 1, y: 1 };
    case NEIGHBOUR_DIR.DOWNLEFT:
      return { x: -1, y: 1 };
  }
}

export default function(Blockly: any) {
  Blockly.JavaScript["environment_coordinate_pair"] = function(block: Block) {
    let value_x_coord =
      Blockly.JavaScript.valueToCode(
        block,
        "X_COORD",
        Blockly.JavaScript.ORDER_ATOMIC
      ) || 0;

    let value_y_coord =
      Blockly.JavaScript.valueToCode(
        block,
        "Y_COORD",
        Blockly.JavaScript.ORDER_ATOMIC
      ) || 0;

    let code = `({ x: ${value_x_coord}, y: ${value_y_coord} })`;

    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript["environment_reachable"] = function(block: Block) {
    var value_coord = Blockly.JavaScript.valueToCode(
      block,
      "COORD",
      Blockly.JavaScript.ORDER_ATOMIC
    );

    var code = removeIdentation(`
    (function __isReachable__() {
      var coord = ${value_coord};

      return isCoordReachable(coord.x, coord.y);
    })()
    `);

    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript["environment_position"] = function() {
    var code = "{ x: getXCoord(), y: getYCoord() }";

    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript["environment_get_x"] = function(block: Block) {
    var value_coord = Blockly.JavaScript.valueToCode(
      block,
      "COORD",
      Blockly.JavaScript.ORDER_ATOMIC
    );

    var code = removeIdentation(`
    (function __getX__(coord) {
      return coord.x;
    })(${value_coord})
    `);
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript["environment_get_y"] = function(block: Block) {
    var value_coord = Blockly.JavaScript.valueToCode(
      block,
      "COORD",
      Blockly.JavaScript.ORDER_ATOMIC
    );

    var code = removeIdentation(`
    (function __getY__(coord) {
      return coord.y;
    })(${value_coord})
    `);
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript["environment_get_neighbour"] = function(block: Block) {
    var value_coord = Blockly.JavaScript.valueToCode(
      block,
      "COORD",
      Blockly.JavaScript.ORDER_ATOMIC
    );
    var dropdown_direction = block.getFieldValue("DIRECTION");

    // Transfrom the directions in dx and dy values
    let neighbourCoord = getCoordinateNeighbour(dropdown_direction);

    let dXString = "",
      dYString = "";

    if (neighbourCoord.x === -1) {
      dXString = " - 1";
    } else if (neighbourCoord.x === 1) {
      dXString = " + 1";
    }

    if (neighbourCoord.y === -1) {
      dYString = " - 1";
    } else if (neighbourCoord.y === 1) {
      dYString = " + 1";
    }

    var code = removeIdentation(`
    (function __getNeighbour__(coord) {
      return { x: coord.x${dXString}, y: coord.y${dYString} };
    })(${value_coord})
    `);

    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };
}
