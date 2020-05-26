// service worker and pwa logic
import PwaHandler from "./system/PwaHandler";
import GameManager from "./online/GameManager";
import BlocklyManager from "./Blockly/BlocklyManager";

// fire sw registering and such
PwaHandler.init();

BlocklyManager.getInstance();
GameManager.getInstance();
