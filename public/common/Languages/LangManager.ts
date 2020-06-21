import LangFile from "./LangFileInterface";

export default class LangManager {
  private static _instance: LangManager = null;
  // The codes of the languages with the associated filenames
  public static readonly LANGS = {
    en: "en.ts",
    ro: "ro.ts"
  };
  public static readonly DEFAULT_LANG = "en";

  /** Class methods and properties */
  private langFiles: { [langCode: string]: LangFile } = {};

  private constructor() {}

  // langCode is the identifier of the language in the langFiles dictionary object
  // If the lang file hasn't been imported yet it will be imported. That's why the function is asynchronous
  public async get(langCode: string): Promise<LangFile> {
    langCode = this.getLangCodeOrDefault(langCode);

    if (!this.langFiles[langCode]) {
      this.langFiles[langCode] = (
        await import(`./${LangManager.LANGS[langCode]}`)
      ).default;
    }

    return this.langFiles[langCode];
  }

  // If the provided language code is not valid choose the default language
  public getLangCodeOrDefault(langCode: string) {
    if (!LangManager.LANGS.hasOwnProperty(langCode)) {
      langCode = LangManager.DEFAULT_LANG;
    }

    return langCode;
  }

  // The first call to getInstance imports the languageFile internally
  public static getInstance(): LangManager {
    if (!this._instance) {
      this._instance = new LangManager();
    }

    return this._instance;
  }
}
