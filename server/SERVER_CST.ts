import COMMON_CST from "../public/common/CommonCST";

export default {
  PUBLIC_FOLDER: "./public",
  NO_AUTH_FOLDER: "./public/no_auth",
  WEB_MANIFEST: "/manifest.webmanifest",
  MANIFEST_FILE: "../../public/manifest.webmanifest",
  USERS: {
    PASS_MINLENGTH: 6,
    PASS_MAXLENGTH: 20
  },
  TEMP_MSG: {
    SUCCESS: "success_msg",
    ERROR: "error_msg",
    PASSPORT_ERR: "error"
  },
  // The cookie set on user login with the user's encrypted db id
  SESSION_COOKIE: {
    ID: "sessId"
  },
  EVENTS: {
    GAME: {
      INITED: "gameinited"
    }
  },
  ROUTES: {
    LOGOUT_PARAM: {
      REASON: "reason",
      // User gets kicked if he tries to connect on
      // multiple pages / devices
      KICK: "kick"
    }
  },
  GAME_CONFIG: {
    INITIAL_COINS: 90000000
  },
  GAME_INSTANCE: {
    // Update the game instance and save to db every 20s
    UPDATE_INTERVAL: 20000
  },
  // Common constants between the client and the server
  COMMON_CST
};
