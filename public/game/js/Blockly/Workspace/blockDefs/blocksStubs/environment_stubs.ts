import { Block } from "blockly";
import { BlocklyJS } from "../codeUtils";
import CODE_CST from "../../../CODE_CST";

const API = CODE_CST.API_FUNCS;
const { SELF } = CODE_CST;

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

export default function(Blockly: BlocklyJS) {
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

    // The coordinate pair can be used with a member access operator
    return [code, Blockly.JavaScript.ORDER_MEMBER];
  };

  Blockly.JavaScript["environment_reachable"] = function(block: Block) {
    var value_coord = Blockly.JavaScript.valueToCode(
      block,
      "COORD",
      Blockly.JavaScript.ORDER_MEMBER
    );

    var code = `${SELF}.${API.REACHABLE}(${value_coord}.x, ${value_coord}.y)`;

    // This function call can be used safely with a logical not operator
    return [code, Blockly.JavaScript.ORDER_LOGICAL_NOT];
  };

  Blockly.JavaScript["environment_position"] = function() {
    var code = `({ x: ${SELF}.${API.POS_X}(), y: ${SELF}.${API.POS_Y}() })`;

    return [code, Blockly.JavaScript.ORDER_MEMBER];
  };

  Blockly.JavaScript["environment_get_x"] = function(block: Block) {
    var value_coord = Blockly.JavaScript.valueToCode(
      block,
      "COORD",
      Blockly.JavaScript.ORDER_MEMBER
    );

    var code = `${value_coord}.x`;

    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript["environment_get_y"] = function(block: Block) {
    var value_coord = Blockly.JavaScript.valueToCode(
      block,
      "COORD",
      Blockly.JavaScript.ORDER_MEMBER
    );

    var code = `${value_coord}.y`;

    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript["environment_get_neighbour"] = function(block: Block) {
    var value_coord = Blockly.JavaScript.valueToCode(
      block,
      "COORD",
      Blockly.JavaScript.ORDER_MEMBER
    );
    var dropdownDir: NEIGHBOUR_DIR = block.getFieldValue("DIRECTION");

    // Transfrom the directions in dx and dy values
    let neighbourCoord = getCoordinateNeighbour(dropdownDir);

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

    // Transform the upper case direction into a title cased string
    let titleCaseDirection =
      dropdownDir.substr(0, 1) + dropdownDir.substr(1).toLowerCase();

    // Generate a function that sits up-top outside the generated code and can be easily called
    // The name of the newly created function will be returned
    let functionName = Blockly.JavaScript.provideFunction_(
      `getNeighbour${titleCaseDirection}`,
      [
        `function ${Blockly.JavaScript.FUNCTION_NAME_PLACEHOLDER_}(coord) {`,
        ` // Get the neighbour of coord in ${titleCaseDirection} direction`,
        ` return { x: coord.x${dXString}, y: coord.y${dYString} };`,
        "}"
      ]
    );

    // Call the get neighbour function
    var code = `${functionName}(${value_coord})`;

    return [code, Blockly.JavaScript.ORDER_MEMBER];
  };
}
