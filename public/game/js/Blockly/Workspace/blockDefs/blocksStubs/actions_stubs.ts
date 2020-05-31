import { Block } from "blockly";

// Remove excessive identation from the code
function removeIdentation(string: string) {
  let splitStrings = string.split("\n");

  let leadingSpaceCount =
    splitStrings[1].length - splitStrings[1].trimStart().length;

  return splitStrings.reduce((accStr: string, currString: string) => {
    return accStr + currString.substr(leadingSpaceCount) + "\n";
  });
}

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
