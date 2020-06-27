import Blockly, { Block } from "blockly";
import CODE_CST from "../../CODE_CST";
import BuildingsManager from "../../../managers/BuildingsManager";
import BuildingObject from "../../../gameObjects/BuildingObject";

const EXT = CODE_CST.BLOCKS_EXTENSIONS;
const BLOCKS = CODE_CST.BLOCKS;

/// Define the extensions for dynamic blocks (that change at runtime)
export default function registerExtensions() {
  // Add the dropdown with all map buildings
  Blockly.Extensions.register(EXT.GEN_BUILDS_DROPDOWN, function() {
    (this as Block)
      .getInput("BUILD")
      .appendField(
        new Blockly.FieldDropdown(getBuildingsOptions),
        BLOCKS.PROD_READY.BUILDS_DROPDOWN
      );
  });
}

// Get the currently available buildings in the form of a dropdown options array
function getBuildingsOptions(): [string, string][] {
  let options = [];

  BuildingsManager.getInstance().sceneBuildings.children.iterate(
    (building: BuildingObject, idx) => {
      // The translated building name should be indexed by building type in the blocksLang.ts file
      let buildName = `${Blockly.Msg[building.buildingType]} ${idx + 1}`;

      options.push([buildName, building.dbId]);
    }
  );

  // Add the "any" building option
  let any = Blockly.Msg[BLOCKS.PROD_READY.ANY_BKY_MSG_ID];
  options.push([any, BLOCKS.PROD_READY.ANY_OPTION_ID]);

  return options;
}
