import Dialog from "./bootstrapObjects/Dialog";
import CST from "../../CST";
import BlocklyManager from "../../Blockly/BlocklyManager";
import AudioManager from "../../managers/AudioManager";
import ResourcesManager from "../../managers/ResourcesManager";

const ST = CST.SETTINGS;

export default class Settings {
  private static instance: Settings = null;

  private dialog: Dialog;
  private openWindow = false;
  private saveChangesBtn: HTMLButtonElement;

  private envAnimsCheck: HTMLInputElement;
  private blocklyRendSelect: HTMLSelectElement;
  private uiVolumeRange: HTMLInputElement;

  private constructor() {
    this.dialog = Dialog.getInstance();
    this.initButton();
    this.dialog.on(CST.WINDOW.CLOSE_EVENT, this.close, this);
  }

  public show() {
    this.openWindow = true;
    // Show the dialog holding the settings
    this.dialog.show("Settings", ST.CONTENT_HTML);

    this.dialog.footerElement.prepend(this.saveChangesBtn);
    this.getSettingsElements();
  }

  public close() {
    if (!this.openWindow) {
      return;
    }

    this.openWindow = false;
    this.dialog.footerElement.removeChild(this.saveChangesBtn);
  }

  private initButton() {
    this.saveChangesBtn = document.createElement("button");
    this.saveChangesBtn.classList.add(...ST.SAVE_CHANGES_BTN_CLS);
    this.saveChangesBtn.innerText = ST.INNER_SAVE_CHANGES_TXT;
    this.saveChangesBtn.onclick = this.applySettingsChanges;
  }

  private getSettingsElements() {
    this.envAnimsCheck = document.getElementById(
      ST.ANIM_CHECK_ID
    ) as HTMLInputElement;
    this.blocklyRendSelect = document.getElementById(
      ST.BLOCKLY_RENDER_ID
    ) as HTMLSelectElement;
    this.uiVolumeRange = document.getElementById(
      ST.UI_VOL_ID
    ) as HTMLInputElement;

    this.blocklyRendSelect.value = BlocklyManager.getInstance().currentRenderer;
    this.uiVolumeRange.value = (
      AudioManager.getInstance().uiSoundsVolume * 100
    ).toString();
    this.envAnimsCheck.checked = ResourcesManager.getInstance().animationsActive;
  }

  private applySettingsChanges = () => {
    let newRenderer = this.blocklyRendSelect.value as "zelos" | "geras";
    let bkyManager = BlocklyManager.getInstance();

    let currUiVolume = parseFloat(this.uiVolumeRange.value) / 100;
    let audioManager = AudioManager.getInstance();

    if (newRenderer !== bkyManager.currentRenderer) {
      bkyManager.initWorkspace(newRenderer);
    }

    if (currUiVolume !== audioManager.uiSoundsVolume) {
      audioManager.uiSoundsVolume = currUiVolume;
    }

    // TODO: Handle deactivation of the animations and such
    ResourcesManager.getInstance().animationsActive = this.envAnimsCheck.checked;

    this.dialog.close();
  };

  public static getInstance(): Settings {
    if (!this.instance) {
      this.instance = new Settings();
    }

    return this.instance;
  }
}
