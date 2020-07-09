import Dialog from "./bootstrapObjects/Dialog";

export default class Settings {
  private static instance: Settings = null;

  private dialog: Dialog;

  private constructor() {
    this.dialog = Dialog.getInstance();
  }

  public show() {
    // Show the dialog holding the settings
    this.dialog.show("Settings");
  }

  public static getInstance(): Settings {
    if (!this.instance) {
      this.instance = new Settings();
    }

    return this.instance;
  }
}
