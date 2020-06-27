// How a langFile's interface should look like
export default interface LangFile {
  login: {
    title: string;
    pass: string;
    btn: string;
    registerRedirect: string;
    register: string;
    placeholdEmail: string;
    placeholdPass: string;
  };
  register: {
    title: string;
    nickname: string;
    pass: string;
    confirmPass: string;
    btn: string;
    loginRedirect: string;
    login: string;
    placeholdNickname: string;
    placeholdEmail: string;
    placeholdPass: string;
    placeholdConfirmPass: string;
  };
  logout: {
    anotherDeviceReason: string;
  };
  // Messages displayed to the user on the login page
  loginMessages: {
    logoutMessage: string;
    reason: string;
    registerSuccessful: string;
    registerFailed: string;
  };
  // Game toasts and such
  buildings: {
    noFunds: string;
    cannotPlace: string;
    noActorSelected: string;
    // Translations of the buildings names
    names: {
      [buildingName: string]: string;
    };
    description: {
      prodReady: string;
      prodNotReady: string;
    };
  };
  actors: {
    cannotOpenWorkspace: string;
  };
  Blockly: {
    labels: {
      coords: string;
      builds: string;
    };
  };
}

export const LanguageIds: {
  langCode: string;
  flagCode: string;
  langName: string;
}[] = [
  {
    langCode: "en",
    // The two letter ISO country code
    flagCode: "gb",
    // The name of the language shown on the login page
    langName: "English"
  },
  {
    langCode: "ro",
    // The two letter ISO country code
    flagCode: "ro",
    // The name of the language shown on the login page
    langName: "Română"
  }
];
