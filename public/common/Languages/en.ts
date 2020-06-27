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
    placeholdPass: "Enter Password"
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
    placeholdConfirmPass: "Confirm Password"
  },
  logout: {
    anotherDeviceReason: "This account connected on another device"
  },
  // Messages displayed to the user on the login page
  loginMessages: {
    logoutMessage: "You have been logged out!",
    reason: "Reason",
    registerSuccessful: "You have been successfully registered!",
    registerFailed: "Registration failed! Please try again later!"
  },
  // Game toasts and such
  buildings: {
    noFunds: "Insufficient funds!",
    cannotPlace: "The building cannot be placed here!",
    noActorSelected: "Select a character to collect the building!",
    names: {
      [BuildNames.residential]: "Residential Building"
    },
    description: {
      prodReady:
        "The production is ready. Send a character to collect the resources.",
      prodNotReady: "The production will be ready in: "
    }
  },
  actors: {
    cannotOpenWorkspace: "Select a character to open the code editor!"
  },
  Blockly: {
    labels: {
      coords: "Coordinates:",
      builds: "Buildings:"
    }
  }
};

export default en;
