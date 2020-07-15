import LangFile from "./LangFileInterface";
import { BuildNames } from "../BuildingTypes";

const ro: LangFile = {
  login: {
    title: "Autentifică-te",
    pass: "Parolă",
    btn: "Login",
    registerRedirect: "Nu ești înregistrat? ",
    register: "Înregistrează-te",
    placeholdEmail: "Introduceți Email-ul",
    placeholdPass: "Introduceți Parola",
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
    placeholdConfirmPass: "Confirmă Parola",
  },
  logout: {
    anotherDeviceReason: "Un alt device s-a conectat cu acest cont.",
  },
  // Messages displayed to the user on the login page
  loginMessages: {
    logoutMessage: "Ați fost delogat!",
    reason: "Motivul",
    registerSuccessful: "V-ați înregistrat cu succes",
    registerFailed: "Înregistrarea a eșuat! Încercați mai târziu.",
  },
  // Game toasts and such
  buildings: {
    noFunds: "Nu aveți resurse suficiente!",
    cannotPlace: "O clădire nu poate fi plasată aici!",
    noActorSelected: "Selectați un caracter pentru a culege resursele!",
    names: {
      [BuildNames.residential]: "Clădire Rezidențială",
    },
    description: {
      prodReady:
        "Producția este gata. Trimiteți un caracter să colecteze resursele.",
      prodNotReady: "Producția va fi gata în: ",
    },
  },
  actors: {
    cannotOpenWorkspace:
      "Selectați un caracter pentru a deschide editorul de cod!",
  },
  Blockly: {
    labels: {
      coords: "Coordonate:",
      builds: "Clădiri:",
    },
  },
  settings: {
    title: "Setări",
    closeBtn: "Închide",
    saveBtn: "Salvează Schimbările",
    labels: {
      bkyRenderer: "Aspectul Editorului de Cod:",
      envAnims: "Activează Animațiile de Mediu",
      uiVolume: "Volum UI",
    },
    bkyRendererOptions: {
      scratch: "Aspect Scratch",
      blockly: "Aspect Blockly",
    },
  },
  leaderboard: {
    title: "Clasament",
    closeBtn: "Închide",
    tableEntries: {
      name: "Nume",
      islandsCount: "Numărul Insulelor",
      buildingsCount: "Numărul Clădirilor",
      charasCount: "Numărul Caracterelor",
    },
  },
  // Code related to the character's terminal
  terminal: {
    // The greet line (first in the terminal)
    greet: "Salutări din terminalul acestui caracter!",
    // The lines describing the terminal
    description: [
      "Aici puteți vedea codul rulat de acest caracter și",
      'orice este afișat cu ajutorul comenzii "imprimare" și puteți rula comenzi.',
      'Inserați comanda "help" pentru mai multe detalii!',
    ],

    // The commands for the terminal
    cmds: {
      // The translated "Error message"
      error: "Eroare",
      unkownCmd: "Comandă necunoscută",
      // The help messages shown by the "help cmd"
      help: {
        help: "Afișați acest dialog de ajutor",
        clear: "Ștergeți conținutul terminalului",
      },
      // Messages displayed to the user
      msg: {
        // The message that's being displayed when a command is run
        runningCode: "Următorul cod este rulat:",
        // The message prepended to a text output
        textOutput: "Text imprimat din cod:",
        errorCaught: "O eroare a fost aruncată în cod:",
      },
    },
  },
};

export default ro;
