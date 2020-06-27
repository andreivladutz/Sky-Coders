import { BuildNames } from "../../../../../common/BuildingTypes";
import CST from "../../CODE_CST";
const BLOCKS = CST.BLOCKS;

export default {
  // Blocks localizations by category
  ENVIRONMENT: {
    EN: {
      ENV_COORDINATE_PAIR_TOOLTIP: "Coordinate pair",
      ENV_REACHABLE_TITLE: "%1 can be reached?",
      ENV_REACHABLE_TOOLTIP:
        "Check if a coordinate pair is reachable for this character. Returns true / false.",
      ENV_CURRPOS_TITLE: "current position",
      ENV_CURRPOS_TOOLTIP:
        "Get the current position coordinate for this character.",
      ENV_X_COORD_TITLE: "x coordinate of %1",
      ENV_X_COORD_TOOLTIP:
        "Get the x coordinate from an (x, y) coordinate pair.",
      ENV_Y_COORD_TITLE: "y coordinate of %1",
      ENV_Y_COORD_TOOLTIP:
        "Get the y coordinate from an (x, y) coordinate pair.",
      ENV_NEIGHBOUR_DIR_TITLE: "neighbour of %1 in %2 direction",
      ENV_NEIGHBOUR_DIR_TOOTLTIP:
        "Get the neighbour of a coordinate (x, y) in a chosen direction.",
      ENV_NEIGHBOUR_UP: "up",
      ENV_NEIGHBOUR_DOWN: "down",
      ENV_NEIGHBOUR_LEFT: "left",
      ENV_NEIGHBOUR_RIGHT: "right",
      ENV_NEIGHBOUR_UPLEFT: "up-left",
      ENV_NEIGHBOUR_UPRIGHT: "up-right",
      ENV_NEIGHBOUR_DOWNLEFT: "down-left",
      ENV_NEIGHBOUR_DOWNRIGHT: "down-right",
      ENV_BUILDING_TITLE: "building %1",
      [BuildNames.residential]: "residential",
      ENV_BUILDING_TOOLTIP: "Choose one of the buildings you own.",
      [BLOCKS.PROD_READY.ANY_BKY_MSG_ID]: "any",
      ENV_BUILDINGS_LIST_TITLE: "buildings list",
      ENV_BUILDINGS_LIST_TOOLTIP:
        "The list containing all the buildings on the map.",
      ENV_READY_TITLE: "%1 is ready?",
      ENV_READY_TOOLTIP: "Check if a building finished its production."
    },
    RO: {
      ENV_COORDINATE_PAIR_TOOLTIP: "O pereche de coordonate",
      ENV_REACHABLE_TITLE: "%1 este accesibilă?",
      ENV_REACHABLE_TOOLTIP:
        "Verifică dacă caracterul curent poate ajunge la perechea de coordonate inserată. Întoarce adevărat / fals.",
      ENV_CURRPOS_TITLE: "poziția curentă",
      ENV_CURRPOS_TOOLTIP:
        "Obține coordonatele poziției curente a acestui caracter.",
      ENV_X_COORD_TITLE: "coordonata x din %1",
      ENV_X_COORD_TOOLTIP:
        "Obține coordonata x a unei perechi de coordonate (x, y).",
      ENV_Y_COORD_TITLE: "coordonata y din %1",
      ENV_Y_COORD_TOOLTIP:
        "Obține coordonata y a unei perechi de coordonate (x, y).",
      ENV_NEIGHBOUR_DIR_TITLE: "vecinul pentru %1 în direcția %2",
      ENV_NEIGHBOUR_DIR_TOOTLTIP:
        "Obține vecinul unei coordonate (x, y) în direcția aleasă.",
      ENV_NEIGHBOUR_UP: "sus",
      ENV_NEIGHBOUR_DOWN: "jos",
      ENV_NEIGHBOUR_LEFT: "stânga",
      ENV_NEIGHBOUR_RIGHT: "dreapta",
      ENV_NEIGHBOUR_UPLEFT: "sus-stânga",
      ENV_NEIGHBOUR_UPRIGHT: "sus-dreapta",
      ENV_NEIGHBOUR_DOWNLEFT: "jos-stânga",
      ENV_NEIGHBOUR_DOWNRIGHT: "jos-dreapta",
      ENV_BUILDING_TITLE: "clădire %1",
      [BuildNames.residential]: "rezidențială",
      ENV_BUILDING_TOOLTIP: "Alegeți una dintre clădirile pe care le dețineți.",
      [BLOCKS.PROD_READY.ANY_BKY_MSG_ID]: "oricare",
      ENV_BUILDINGS_LIST_TITLE: "lista clădirior",
      ENV_BUILDINGS_LIST_TOOLTIP:
        "Lista care conține toate clădirile de pe hartă.",
      ENV_READY_TITLE: "%1 este gata?",
      ENV_READY_TOOLTIP: "Verifică dacă o clădire și-a terminat producția."
    }
  },
  ACTIONS: {
    EN: {
      ACTIONS_WALK_TITLE: "walk to grid coordinate %1",
      ACTIONS_WALK_TOOLTIP:
        "Tell the character to walk to the inserted coordinate.",
      ACTIONS_COLLECT_TITLE: "Collect %1",
      ACTIONS_COLLECT_TOOLTIP:
        "Tell the character to walk to a building and collect its resources."
    },
    RO: {
      ACTIONS_WALK_TITLE: "mergi pe hartă la coordonata %1",
      ACTIONS_WALK_TOOLTIP:
        "Spune caracterului să meargă la coordonata inserată.",
      ACTIONS_COLLECT_TITLE: "Colectează %1",
      ACTIONS_COLLECT_TOOLTIP:
        "Spune caracterului să meargă la o clădire pentru a colecta resursele."
    }
  },
  EVENTS: {
    EN: {
      EVENTS_SELECTED_TITLE: "When selected",
      EVENTS_SELECTED_TOOLTIP:
        "All connected code runs when this character is selected.",
      EVENTS_PRODREADY_TITLE: "When %1 %2 is ready",
      EVENTS_PRODREADY_TOOLTIP:
        "Runs the code when one building has finished its production",
      EVENTS_PRODREADY_VAR: "building",
      COMMAND_TITLE: "Define command %1",
      COMMAND_TOOLTIP: "Create a command for this character.",
      COMMAND_NAME: "Do Something"
    },
    RO: {
      EVENTS_SELECTED_TITLE: "Când este selectat",
      EVENTS_SELECTED_TOOLTIP:
        "Codul conectat va rula când acest caracter este selectat.",
      EVENTS_PRODREADY_TITLE: "Când %1 %2 este gata",
      EVENTS_PRODREADY_TOOLTIP:
        "Codul conectat va rula când o clădire și-a terminat producția.",
      EVENTS_PRODREADY_VAR: "clădire",
      COMMAND_TITLE: "Definește comanda %1",
      COMMAND_TOOLTIP: "Creează o comandă pentru acest caracter.",
      COMMAND_NAME: "Fă Ceva"
    }
  }
};
