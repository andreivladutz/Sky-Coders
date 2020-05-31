// https://blockly-demo.appspot.com/static/demos/blockfactory/index.html#ru9enq
import actionsCategory from "./blocksStubs/actions_stubs";
import environmentCategory from "./blocksStubs/environment_stubs";

import Blockly from "blockly";

/**
 * Define the custom blocks for blockly using the json definitions and
 * code generation stubs exported from the Blockly Developer Tools
 *
 * @param blockDefs array of parsed json objects loaded using Phaser's Loader
 */
export default function defineCustomBlocks(blockDefs: Object[]) {
  // Add the JavaScript code generation
  actionsCategory(Blockly);
  environmentCategory(Blockly);

  Blockly.defineBlocksWithJsonArray(blockDefs);
}
