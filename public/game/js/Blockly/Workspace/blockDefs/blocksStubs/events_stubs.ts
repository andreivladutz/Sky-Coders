import { Block } from "blockly";
import { BlocklyJS } from "../codeUtils";
import CODE_CST from "../../../CODE_CST";

// The events and commands don't generate any meaningful code
export default function(Blockly: BlocklyJS) {
  Blockly.JavaScript["events_selected"] = function(block: Block) {
    return "";
  };

  Blockly.JavaScript["events_prod_ready"] = function(block: Block) {
    let variable_building = Blockly.JavaScript.variableDB_.getName(
      block.getFieldValue("BUILDING"),
      Blockly.Variables.NAME_TYPE
    );

    // Get the user chosen building id
    let chosenBuildingId = block.getFieldValue(
      CODE_CST.BLOCKS.PROD_READY.BUILDS_DROPDOWN
    );

    // If the chosen id is #any# it will be replaced inside ActorCodeHandler
    // with a valid building id that fired the prodready event
    return `${variable_building} = ${CODE_CST.INTERNALS.INTERNAL_OBJ}.${CODE_CST.INTERNALS.BUILDINGS_DICT}["${chosenBuildingId}"];\n`;
  };

  Blockly.JavaScript["command"] = function(block: Block) {
    // var text_name = block.getFieldValue("NAME");
    return "";
  };
}
