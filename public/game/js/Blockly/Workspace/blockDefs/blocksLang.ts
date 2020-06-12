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
      ENV_NEIGHBOUR_DOWNRIGHT: "down-right"
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
      ENV_NEIGHBOUR_DOWNRIGHT: "jos-dreapta"
    }
  },
  ACTIONS: {
    EN: {
      ACTIONS_WALK_TITLE: "walk to grid coordinate %1",
      ACTIONS_WALK_TOOLTIP:
        "Tell the character to walk to the inserted coordinate."
    },
    RO: {
      ACTIONS_WALK_TITLE: "mergi pe hartă la coordonata %1",
      ACTIONS_WALK_TOOLTIP:
        "Spune caracterului să meargă la coordonata inserată."
    }
  },
  EVENTS: {
    EN: {
      EVENTS_SELECTED_TITLE: "When selected",
      EVENTS_SELECTED_TOOLTIP:
        "All connected code runs when this character is selected.",
      EVENTS_PRODREADY_TITLE: "When production ready",
      EVENTS_PRODREADY_TOOLTIP:
        "Runs connected code when one building has finished its production",
      COMMAND_TITLE: "Define command %1",
      COMMAND_TOOLTIP: "Create a command for this character.",
      COMMAND_NAME: "Do Something"
    },
    RO: {
      EVENTS_SELECTED_TITLE: "Când este selectat",
      EVENTS_SELECTED_TOOLTIP:
        "Codul conectat va rula când acest caracter este selectat.",
      EVENTS_PRODREADY_TITLE: "Când producția este gata",
      EVENTS_PRODREADY_TOOLTIP:
        "Codul conectat va rula când una din clădiri și-a terminat producția.",
      COMMAND_TITLE: "Definește comanda %1",
      COMMAND_TOOLTIP: "Creează o comandă pentru acest caracter.",
      COMMAND_NAME: "Fă Ceva"
    }
  }
};
