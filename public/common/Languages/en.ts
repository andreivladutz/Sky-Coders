import LangFile from "./LangFileInterface";
import { BuildNames } from "../BuildingTypes";

const en: LangFile = {
  login: {
    title: "Login",
    pass: "Password",
    btn: "Login",
    registerRedirect: "No Account? ",
    register: "Register",
    placeholdEmail: "Enter Email",
    placeholdPass: "Enter Password",
  },
  register: {
    title: "Register",
    nickname: "Game Nickname",
    pass: "Password",
    confirmPass: "Confirm Password",
    btn: "Register",
    loginRedirect: "Have An Account?",
    login: "Login",
    placeholdNickname: "Enter a Nickname",
    placeholdEmail: "Enter Email",
    placeholdPass: "Create a Password",
    placeholdConfirmPass: "Confirm Password",
  },
  logout: {
    anotherDeviceReason: "This account connected on another device",
  },
  // Messages displayed to the user on the login page
  loginMessages: {
    logoutMessage: "You have been logged out!",
    reason: "Reason",
    registerSuccessful: "You have been successfully registered!",
    registerFailed: "Registration failed! Please try again later!",
  },
  // Game toasts and such
  buildings: {
    noFunds: "Insufficient funds!",
    cannotPlace: "The building cannot be placed here!",
    noActorSelected: "Select a character to collect the building!",
    names: {
      [BuildNames.residential]: "Residential Building",
    },
    description: {
      prodReady:
        "The production is ready. Send a character to collect the resources.",
      prodNotReady: "The production will be ready in: ",
    },
  },
  actors: {
    cannotOpenWorkspace: "Select a character to open the code editor!",
  },
  Blockly: {
    labels: {
      coords: "Coordinates:",
      builds: "Buildings:",
    },
  },
  settings: {
    title: "Settings",
    closeBtn: "Close",
    saveBtn: "Save Changes",
    labels: {
      bkyRenderer: "Code Editor's Look:",
      envAnims: "Enable Environment Animations",
      uiVolume: "UI Volume",
    },
    bkyRendererOptions: {
      scratch: "Scratch Look",
      blockly: "Blockly Look",
    },
  },
  leaderboard: {
    title: "Leaderboard",
    closeBtn: "Close",
    tableEntries: {
      name: "Name",
      islandsCount: "Islands Count",
      buildingsCount: "Buildings Count",
      charasCount: "Charas Count",
    },
  },
  // Code related to the character's terminal
  terminal: {
    // The greet line (first in the terminal)
    greet: "Hello from this character's terminal!",
    // The lines describing the terminal
    description: [
      "Here you can see any code that's being run for this character and",
      'any text output using the"print" command.',
      'You can also type and run commands. Type "help" for more details!',
    ],
    // The commands for the terminal
    cmds: {
      // The translated "Error message"
      error: "Error",
      unkownCmd: "Unknown command",
      // The help messages shown by the "help cmd"
      help: {
        help: "Display this help dialog",
        clear: "Clear the terminal contents",
      },
      // Messages displayed to the user
      msg: {
        // The message that's being displayed when a command is run
        runningCode: "Running the following code:",
        // The message prepended to a text output
        textOutput: "Text output from code:",
        errorCaught: "Error caught inside code:",
      },
    },
  },
};

export default en;
