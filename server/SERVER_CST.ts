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
  }
};
