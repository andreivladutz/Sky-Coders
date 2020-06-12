import { Block } from "blockly";
import { BlocklyJS } from "../codeUtils";

// The events and commands don't generate any meaningful code
export default function(Blockly: BlocklyJS) {
  Blockly.JavaScript["events_selected"] = function(block: Block) {
    return "";
  };

  Blockly.JavaScript["events_prod_ready"] = function(block: Block) {
    return "";
  };

  Blockly.JavaScript["command"] = function(block: Block) {
    // var text_name = block.getFieldValue("NAME");
    return "";
  };
}
