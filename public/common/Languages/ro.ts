import LangFile from "./LangFileInterface";

const ro: LangFile = {
  login: {
    title: "Autentifică-te",
    pass: "Parolă",
    btn: "Login",
    registerRedirect: "Nu ești înregistrat? ",
    register: "Înregistrează-te",
    placeholdEmail: "Introduceți Email-ul",
    placeholdPass: "Introduceți Parola"
  },
  register: {
    title: "Înregistrează-te",
    nickname: "Porecla din Joc",
    pass: "Parolă",
    confirmPass: "Confirmă Parola",
    btn: "Înregistrare",
    loginRedirect: "Ai deja un cont?",
    login: "Autentifică-te",
    placeholdNickname: "Introduceți o poreclă de joc",
    placeholdEmail: "Introduceți Email",
    placeholdPass: "Creați o Parolă",
    placeholdConfirmPass: "Confirmă Parola"
  },
  // Messages displayed to the user on the login page
  loginMessages: {
    logoutMessage: "Ați fost delogat!",
    reason: "Motivul",
    registerSuccessful: "V-ați înregistrat cu succes",
    registerFailed: "Înregistrarea a eșuat! Încercați mai târziu."
  },
  // Game toasts and such
  buildings: {
    noFunds: "Nu aveți resurse suficiente!"
  }
};

export default ro;
