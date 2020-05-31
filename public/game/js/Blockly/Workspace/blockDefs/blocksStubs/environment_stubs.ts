import { Block } from "blockly";

export default function(Blockly: any) {
  Blockly.JavaScript["environment_coordinate_pair"] = function(block: Block) {
    let number_x_coord = block.getFieldValue("X_COORD");
    let number_y_coord = block.getFieldValue("Y_COORD");

    let code = `({ x: ${number_x_coord}, y: ${number_y_coord} })`;

    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };
}
