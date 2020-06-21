import LangFile from "./LangFileInterface";

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
  // Messages displayed to the user on the login page
  loginMessages: {
    logoutMessage: "You have been logged out!",
    reason: "Reason",
    registerSuccessful: "You have been successfully registered!",
    registerFailed: "Registration failed! Please try again later!"
  },
  // Game toasts and such
  buildings: {
    noFunds: "Insufficient funds!"
  }
};

export default en;
