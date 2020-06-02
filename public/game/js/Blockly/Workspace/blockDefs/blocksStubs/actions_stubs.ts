import { Block } from "blockly";
import { removeIdentation } from "../codeUtils";

export default function(Blockly: any) {
  // Walk to block -> Receives a (x, y) coordinate pair block
  Blockly.JavaScript["actions_walk"] = function(block: Block) {
    let value_coordinate =
      Blockly.JavaScript.valueToCode(
        block,
        "COORDINATE",
        Blockly.JavaScript.ORDER_ATOMIC
      ) || "({ x: 0, y: 0 })";

    let code = removeIdentation(`
    (function _navigate_() {
      var gridCoords =  ${value_coordinate};

      walkTo(gridCoords.x, gridCoords.y);
    })();
    `);

    return code;
  };
}
