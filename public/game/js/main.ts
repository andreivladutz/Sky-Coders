// Import bootstrap's css
import "bootstrap/dist/css/bootstrap.min.css";
// service worker and pwa logic
import PwaHandler from "./system/PwaHandler";
import GameManager from "./online/GameManager";

// fire sw registering and such
PwaHandler.init();
GameManager.getInstance();
