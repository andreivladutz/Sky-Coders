import MicroModal from "micromodal";
import CST from "../CST";

// Configuration for a modal button
export interface ButtonCfg {
  text: string;
  closesModal?: boolean;
  isPrimary?: boolean;
}

// Configure a modal before showing
export interface ModalConfig {
  // Enable "x" close button in the header of the modal
  enableClose?: boolean;
  // The title of the modal
  title: string;
  // An array of button configuration objects
  buttons?: ButtonCfg[];

  content: string;
}

const defaultConfig: ModalConfig = {
  enableClose: true,
  title: "",
  content: ""
};

export default class Modal {
  private static instance: Modal;

  // Whether the window has been initialised
  public static windowInited: boolean = false;
  // The x button in the top right corner
  private closeButton: HTMLButtonElement;
  private titleElement: HTMLHeadingElement;
  private modalFooter: HTMLElement;
  private modalHeader: HTMLElement;
  private modalContent: HTMLElement;
  private modalContainer: HTMLDivElement;

  private constructor() {
    this.initMicromodal();
  }

  private initMicromodal() {
    MicroModal.init({
      onShow: this.onShow.bind(this),
      onClose: this.onClose.bind(this),
      disableScroll: true,
      disableFocus: true,
      awaitOpenAnimation: true,
      awaitCloseAnimation: true
    });

    this.getPieces();

    this.modalContainer.removeAttribute("style");
  }

  // Get the pieces forming a modal
  private getPieces() {
    this.closeButton = document.getElementById(
      CST.UI.MODAL.CLOSE_BUTTON
    ) as HTMLButtonElement;

    this.titleElement = document.getElementById(
      CST.UI.MODAL.TITLE
    ) as HTMLHeadingElement;

    this.modalFooter = document.getElementById(CST.UI.MODAL.FOOTER);
    this.modalContent = document.getElementById(CST.UI.MODAL.CONTENT);
    this.modalHeader = document.getElementById(CST.UI.MODAL.HEADER);

    this.modalContainer = document.getElementById(
      CST.UI.MODAL.ID
    ) as HTMLDivElement;
  }

  // To be overriden
  public onShow = () => {};
  public onClose = () => {};

  // If the window has not yet been inited, wait until it loads
  public open(config: ModalConfig = defaultConfig): this {
    let show = () => {
      MicroModal.show(CST.UI.MODAL.ID);
    };

    this.applyConfig(config);

    if (!Modal.windowInited) {
      window.addEventListener("load", show);
    } else {
      show();
    }

    return this;
  }

  public close(): this {
    MicroModal.close(CST.UI.MODAL.ID);

    return this;
  }

  // Create a button element and add it to the modal footer
  public addButton(btnCfg: ButtonCfg): this {
    const BTN = CST.UI.MODAL.BUTTONS;
    let button = document.createElement("button");

    button.innerText = btnCfg.text;
    button.classList.add(BTN.CLASS);

    if (btnCfg.closesModal) {
      button.setAttribute(BTN.CLOSE_ATTRIB, "");
      button.setAttribute("aria-label", BTN.CLOSE_ARIA_LABEL);
    }

    if (btnCfg.isPrimary) {
      button.classList.add(BTN.PRIMARY_CLASS);
    }

    this.modalFooter.appendChild(button);

    return this;
  }

  public appendContent(content: string): this {
    let p = document.createElement("p");
    p.innerText = content;

    this.modalContent.appendChild(p);

    return this;
  }

  // Append or prepend a html element to the main content or the header of the modal
  public addHTMLElementTo(
    position: "main" | "header",
    element: HTMLElement,
    action: "append" | "prepend" = "append"
  ): this {
    let positionElement: HTMLElement;

    if (position === "main") {
      positionElement = this.modalContent;
    } else if (position === "header") {
      positionElement = this.modalHeader;
    }

    if (action === "append") {
      positionElement.appendChild(element);
    } else if (action === "prepend") {
      positionElement.prepend(element);
    }

    return this;
  }

  // Apply the configurations on a modal before showing it
  private applyConfig(config: ModalConfig) {
    let closeBtnStyle = config.enableClose ? "" : "none";

    this.closeButton.style.display = closeBtnStyle;
    this.titleElement.innerText = config.title;

    this.appendContent(config.content);

    if (!config.buttons || !config.buttons.length) {
      return;
    }

    for (let buttonCfg of config.buttons) {
      this.addButton(buttonCfg);
    }
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new Modal();
    }

    return this.instance;
  }
}

window.addEventListener("load", () => {
  Modal.windowInited = true;
});
