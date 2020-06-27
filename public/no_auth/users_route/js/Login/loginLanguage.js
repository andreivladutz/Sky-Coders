const DROP_BTNS_CLS = "dropdown-item";
const DROP_TOGGLE_CLS = "dropdown-toggle";

const DEFAULT_LANG_CODE = "en";
const LANG_QUERY = "lang";

const LOGIN_PATH = "/users/login";

// Handle language picking
export default class LoginLanguage {
  constructor() {
    // Get all the language buttons
    this.buttons = document.getElementsByClassName(DROP_BTNS_CLS);
    this.dropdownToggle = document.getElementsByClassName(DROP_TOGGLE_CLS)[0];
    // The language code that has been picked
    this.chosenLang = DEFAULT_LANG_CODE;

    // Check if the lang query is present
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get(LANG_QUERY);

    this.currentRoute = `${LOGIN_PATH}?${LANG_QUERY}=${langParam ||
      DEFAULT_LANG_CODE}`;

    if (langParam) {
      // Set the current selected language
      this.dropdownToggle.innerHTML = document.getElementById(
        langParam
      ).innerHTML;
    }

    for (let btn of this.buttons) {
      btn.onclick = () => {
        this.dropdownToggle.innerHTML = btn.innerHTML;
        this.chosenLang = btn.id;

        this.currentRoute = `${LOGIN_PATH}?${LANG_QUERY}=${btn.id}`;
        window.location.assign(this.currentRoute);
      };
    }
  }
}
