import Dialog from "./bootstrapObjects/Dialog";
import CST from "../../CST";
import BlocklyManager from "../../Blockly/BlocklyManager";
import AudioManager from "../../managers/AudioManager";
import ResourcesManager from "../../managers/ResourcesManager";
import GameManager from "../../online/GameManager";

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
    this.translateSettings();

    this.dialog = Dialog.getInstance();
    this.initButton();
    this.dialog.on(CST.WINDOW.CLOSE_EVENT, this.close, this);
  }

  public show() {
    this.openWindow = true;
    // Show the dialog holding the settings
    this.dialog.show(
      GameManager.getInstance().langFile.settings.title,
      ST.CONTENT_HTML
    );

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

  private translateSettings() {
    let settingsLang = GameManager.getInstance().langFile.settings;
    const REPLACE = ST.REPLACE_TOKENS;

    ST.CONTENT_HTML = ST.CONTENT_HTML.replace(
      REPLACE.BKY_OPTIONS.SCRATCH_LIKE,
      settingsLang.bkyRendererOptions.scratch
    )
      .replace(
        REPLACE.BKY_OPTIONS.BLOCKLY_LIKE,
        settingsLang.bkyRendererOptions.blockly
      )
      .replace(REPLACE.BKY_REND_LABEL, settingsLang.labels.bkyRenderer)
      .replace(REPLACE.ENV_ANIM_LABEL, settingsLang.labels.envAnims)
      .replace(REPLACE.UI_VOL_LABEL, settingsLang.labels.uiVolume);
  }

  private initButton() {
    this.saveChangesBtn = document.createElement("button");
    this.saveChangesBtn.classList.add(...ST.SAVE_CHANGES_BTN_CLS);
    this.saveChangesBtn.innerText = GameManager.getInstance().langFile.settings.saveBtn;
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
