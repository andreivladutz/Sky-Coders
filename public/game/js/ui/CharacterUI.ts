import UIComponent from "./UIComponent";
import CST from "../CST";
import Actor from "../gameObjects/Actor";

export default class CharacterUI extends UIComponent {
  private characterContainer: HTMLDivElement;
  private terminalButton: HTMLButtonElement;

  public isEnabled = false;

  public constructor() {
    super(null, null);

    this.characterContainer = document.getElementById(
      CST.CHARA_SELECTION.CONTAINER_ID
    ) as HTMLDivElement;

    this.terminalButton = document.getElementById(
      CST.CHARA_SELECTION.TERMINAL_BTN_ID
    ) as HTMLButtonElement;
  }

  public enable(selectedActor: Actor) {
    this.characterContainer.style.display = "";

    this.terminalButton.onclick = () => {
      selectedActor.terminal.open();
    };

    this.isEnabled = true;
  }

  public turnOff() {
    this.characterContainer.style.display = "none";

    this.isEnabled = false;
  }
}
