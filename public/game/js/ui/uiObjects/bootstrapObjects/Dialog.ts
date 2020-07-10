import $ from "jquery";
import "bootstrap/js/dist/modal";
import CST from "../../../CST";
import GameWindow from "../../GameWindow";
import AudioManager from "../../../managers/AudioManager";
import GameManager from "../../../online/GameManager";

const MODAL = CST.UI.BOOTSTRAP_MODAL;

export default class Dialog extends Phaser.Events.EventEmitter {
  private static instance = null;

  private dialogWindow: GameWindow;
  public contentElement: HTMLDivElement;
  public footerElement: HTMLDivElement;

  private constructor() {
    super();

    this.dialogWindow = new GameWindow();

    $(() => {
      let jQObj = $(`#${MODAL.ID}`);
      this.initModal(jQObj);
    });

    this.dialogWindow.on(
      CST.WINDOW.DEBOUNCED_RESIZE_EVENT,
      this.resizeDialog,
      this
    );

    this.dialogWindow.on(CST.WINDOW.CLOSE_EVENT, () => {
      this.close();
    });
  }

  public show(title: string, content: string = "") {
    this.dialogWindow.openWindow();

    let el = $(`#${MODAL.ID}`);

    el.find(MODAL.TITLE_SELECTOR).text(title);

    this.contentElement = el
      .find(MODAL.CONTENT_SELECTOR)
      .html(content)
      .get()[0] as HTMLDivElement;

    this.footerElement = el
      .find(`.${MODAL.FOOTER_CLASS}`)
      .get()[0] as HTMLDivElement;

    this.dialogWindow.on(CST.WINDOW.OPEN_ANIM_EVENT, () => {
      el.modal("show");
      this.resizeDialog();
    });
  }

  public close() {
    $(() => {
      this.dialogWindow.closeWindow();
      $(`#${MODAL.ID}`).modal("hide");

      this.emit(CST.WINDOW.CLOSE_EVENT);
    });
  }

  private resizeDialog() {
    $(() => {
      let { width, height } = this.dialogWindow.getPixelSize(
        CST.TERMINAL.TERMINAL_RATIO.WIDTH,
        CST.TERMINAL.TERMINAL_RATIO.HEIGHT
      );

      let modalElement = document.getElementsByClassName(
        MODAL.CONTENT_CLASS
      )[0] as HTMLDivElement;

      let modalParentEl = document.getElementsByClassName(
        MODAL.DIALOG_CLASS
      )[0] as HTMLDivElement;

      modalParentEl.style.maxWidth = `${width}px`;
      modalElement.style.width = `${width}px`;
      modalElement.style.height = `${height}px`;
    });
  }

  private initModal(jQObj: JQuery<HTMLElement>) {
    jQObj
      .modal({
        backdrop: "static",
        show: false,
      })
      .on("hide.bs.modal", () => {
        AudioManager.getInstance().playUiSound(CST.AUDIO.KEYS.CLICK);
      })
      .on("hidden.bs.modal", () => {
        this.close();
      })
      // Make the backdrop transparent so we don't really see it but we can use its functionality
      .on("shown.bs.modal", () => {
        let backdrops = document.body.getElementsByClassName(
          MODAL.BACKDROP_CLASS
        );

        for (let backdrop of Array.from(backdrops)) {
          if (backdrop.classList.contains(MODAL.BACKDROP_SHOWN_CLASS)) {
            (backdrop as HTMLDivElement).style.opacity = "0.01";
          }
        }
      })
      .on("hidePrevented.bs.modal", () => {
        this.close();
      });

    jQObj
      .find(".btn.btn-secondary")
      .text(GameManager.getInstance().langFile.settings.closeBtn);
  }

  public static getInstance(): Dialog {
    if (!this.instance) {
      this.instance = new Dialog();
    }

    return this.instance;
  }
}
