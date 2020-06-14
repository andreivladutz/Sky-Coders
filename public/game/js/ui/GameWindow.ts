import CST from "../CST";

import Phaser from "phaser";
import EventEmitter = Phaser.Events.EventEmitter;

/**
 * Events emitting in this order on window open:
 *   - OPEN EVENT
 *   - OPEN ANIM EVENT (when css animation ends)
 *
 * Events emitting in this order on window close:
 *   - CLOSE EVENT
 * If you choose to call close window:
 *   - CLOSE ANIM EVENT
 */
export default class GameWindow extends EventEmitter {
  private windowOverlay: HTMLDivElement;
  public windowContainer: HTMLDivElement;

  public constructor(windowElement?: HTMLDivElement) {
    super();

    this.initContainerElement(windowElement);
    this.hideWindow();
  }

  // Add the animation class so a transition is animated via css
  // After the css animation end, hide the window completely
  public closeWindow(): this {
    // Add the class and attribute used by the css animation (the close anim)
    this.windowOverlay.classList.add(CST.BLOCKLY.ANIMATION.CLASS);
    this.windowOverlay.setAttribute(CST.BLOCKLY.ANIMATION.ATTRIB, "true");

    this.emitOnAnimationEnd(CST.WINDOW.CLOSE_ANIM_EVENT, () => {
      this.hideWindow();
    });

    return this;
  }

  public openWindow(): this {
    // Start open css animaton
    this.windowOverlay.classList.add(CST.BLOCKLY.ANIMATION.CLASS);
    this.windowOverlay.setAttribute(CST.BLOCKLY.ANIMATION.ATTRIB, "false");

    this.windowOverlay.style.display = "";

    this.emit(CST.WINDOW.OPEN_EVENT);
    this.emitOnAnimationEnd(CST.WINDOW.OPEN_ANIM_EVENT);

    return this;
  }

  public hideWindow(): this {
    this.windowOverlay.style.display = "none";

    return this;
  }

  // Emit event when the css animation ends
  public emitOnAnimationEnd(event: string, optionalCb = () => {}) {
    let computedStyle = getComputedStyle(this.windowOverlay);

    let interval = setInterval(() => {
      if (computedStyle.animationPlayState === "running") {
        clearInterval(interval);

        this.emit(event);
        optionalCb();

        this.windowOverlay.classList.remove(CST.BLOCKLY.ANIMATION.CLASS);
        this.windowOverlay.removeAttribute(CST.BLOCKLY.ANIMATION.ATTRIB);
      }
    }, 250);
  }

  // If the user provides a div window element, use that, otherwise create a new one
  private initContainerElement(windowElement?: HTMLDivElement) {
    this.windowOverlay = windowElement
      ? windowElement
      : document.createElement("div");

    if (!windowElement) {
      this.windowOverlay.classList.add(CST.WINDOW.CLASSES.CONTAINER);
      document.body.appendChild(this.windowOverlay);

      this.windowContainer = document.createElement("div");
      this.windowContainer.classList.add(CST.WINDOW.CLASSES.WINDOW);
      this.windowOverlay.appendChild(this.windowContainer);
    } else {
      this.windowContainer = this.windowOverlay.getElementsByClassName(
        CST.WINDOW.CLASSES.WINDOW
      )[0] as HTMLDivElement;
    }

    this.windowOverlay.onclick = e => {
      e.stopPropagation();

      // Emit close event on click outside the window
      if (e.target === this.windowOverlay) {
        this.emit(CST.WINDOW.CLOSE_EVENT);
      }
    };
  }
}
