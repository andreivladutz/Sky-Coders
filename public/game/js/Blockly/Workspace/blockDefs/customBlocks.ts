// https://blockly-demo.appspot.com/static/demos/blockfactory/index.html#ru9enq
import actionsCategory from "./blocksStubs/actions_stubs";
import environmentCategory from "./blocksStubs/environment_stubs";
import eventsCategory from "./blocksStubs/events_stubs";

import blocksLang from "./blocksLang";
import Blockly from "blockly";
import { BlocklyJS } from "./codeUtils";

interface Locales {
  RO: object;
  EN: object;
}

/**
 * Define the custom blocks for blockly using the json definitions and
 * code generation stubs exported from the Blockly Developer Tools
 *
 * @param blockDefs array of parsed json objects loaded using Phaser's Loader
 */
export default function defineCustomBlocks(
  blockDefs: object[],
  locales: Locales
) {
  // Add the JavaScript code generation
  actionsCategory(Blockly as BlocklyJS);
  environmentCategory(Blockly as BlocklyJS);
  eventsCategory(Blockly as BlocklyJS);

  Blockly.defineBlocksWithJsonArray(blockDefs);

  // Add block translations to the locales
  addLocaleBlockText(locales);
}

// Add block messages to the locales
function addLocaleBlockText(locales: Locales) {
  // Take each of the locales with their langKey i.e. "RO", "EN", etc.
  for (let [langKey, locale] of Object.entries(locales)) {
    // Take each category of translations from the lang file
    for (let categoryTranslations of Object.values(blocksLang)) {
      // Take each identifier in the Blockly.Msg object and add the translated text
      for (let [replacementName, blockText] of Object.entries(
        categoryTranslations[langKey]
      )) {
        locale[replacementName] = blockText;
      }
    }
  }
}
