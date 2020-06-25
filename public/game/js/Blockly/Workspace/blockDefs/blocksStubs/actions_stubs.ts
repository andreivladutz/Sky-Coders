import { Block } from "blockly";
import { removeIdentation, BlocklyJS } from "../codeUtils";
import CODE_CST from "../../../CODE_CST";

const API = CODE_CST.API_FUNCS;
const { SELF } = CODE_CST;

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
    ${SELF}.${API.WALK_TO}(${coordVarName}.x, ${coordVarName}.y);
    `);

    return code;
  };

  // Override the generated code for the print block
  Blockly.JavaScript["text_print"] = function(block: Block) {
    // Print statement.
    var msg =
      Blockly.JavaScript.valueToCode(
        block,
        "TEXT",
        Blockly.JavaScript.ORDER_NONE
      ) || "''";
    return `${SELF}.${API.PRINT}((${msg}).toString());\n`;
  };
}
