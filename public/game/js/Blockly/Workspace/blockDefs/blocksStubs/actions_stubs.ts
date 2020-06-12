import { Block } from "blockly";
import { removeIdentation, BlocklyJS } from "../codeUtils";

export default function(Blockly: BlocklyJS) {
  // Walk to block -> Receives a (x, y) coordinate pair block
  Blockly.JavaScript["actions_walk"] = function(block: Block) {
    let value_coordinate =
      Blockly.JavaScript.valueToCode(
        block,
        "COORDINATE",
        Blockly.JavaScript.ORDER_MEMBER
      ) || "{ x: 0, y: 0 }";

    // Get a unique name for this locally used variable
    let coordVarName = Blockly.JavaScript.variableDB_.getDistinctName(
      "gridCoords",
      Blockly.Variables.NAME_TYPE
    );

    let code = removeIdentation(`
    var  ${coordVarName} =  ${value_coordinate};
    walkTo(${coordVarName}.x, ${coordVarName}.y);
    `);

    return code;
  };
}
