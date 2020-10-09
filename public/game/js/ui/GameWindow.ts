import CST from "../CST";

import Phaser from "phaser";
import EventEmitter = Phaser.Events.EventEmitter;
import AudioManager from "../managers/AudioManager";

type WindowSize = {
  width: number;
  height: number;
  left: number;
  top: number;
};

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

  private windowWidthPercentage: number;
  private windowHeightPercentage: number;

  public constructor(windowElement?: HTMLDivElement) {
    super();

    this.initContainerElement(windowElement);
    this.hideWindow();
    this.debounceResizeEvent();
  }

  private debounceResizeEvent() {
    let debounceTimeout = null;

    window.addEventListener("resize", () => {
      if (debounceTimeout) {
        return;
      }

      debounceTimeout = setTimeout(() => {
        this.emit(CST.WINDOW.DEBOUNCED_RESIZE_EVENT);

        debounceTimeout = null;
      }, CST.TERMINAL.DEBOUNCE_TIME);
    });
  }

  private computeWindowPercentages() {
    let divParent = this.windowContainer;
    let parentComputedStyle = getComputedStyle(divParent);

    this.windowWidthPercentage = parseInt(
      parentComputedStyle.getPropertyValue("width")
    );
    this.windowHeightPercentage = parseInt(
      parentComputedStyle.getPropertyValue("height")
    );

    let bodyStyle = getComputedStyle(document.body);
    if (parentComputedStyle.getPropertyValue("width").endsWith("px")) {
      let bodyWidth = parseInt(bodyStyle.getPropertyValue("width"));
      this.windowWidthPercentage = Math.round(
        (this.windowWidthPercentage / bodyWidth) * 100
      );
    }

    if (parentComputedStyle.getPropertyValue("height").endsWith("px")) {
      let bodyHeight = parseInt(bodyStyle.getPropertyValue("height"));
      this.windowHeightPercentage = Math.round(
        (this.windowHeightPercentage / bodyHeight) * 100
      );
    }
  }

  // Get the pixel size for the width, height and position of the
  // inner window of this game window
  /**
   *
   * @param innerWRatio width percentage
   * @param innerHRatio height percentage
   */
  public getPixelSize(innerWRatio: number, innerHRatio: number): WindowSize {
    // The first time around, get the percentages from css
    if (!this.windowHeightPercentage) {
      this.computeWindowPercentages();
    }

    let bodyStyle = getComputedStyle(document.body);
    let bodyHeight = parseInt(bodyStyle.getPropertyValue("height"));
    let bodyWidth = parseInt(bodyStyle.getPropertyValue("width"));

    let realHeight =
      (innerHRatio * (this.windowHeightPercentage * bodyHeight)) / 10000;
    let realWidth =
      (innerWRatio * (this.windowWidthPercentage * bodyWidth)) / 10000;

    let left = (bodyWidth - realWidth) / 2;
    let top = (bodyHeight - realHeight) / 2;

    return {
      width: realWidth,
      height: realHeight,
      left,
      top
    };
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
    AudioManager.getInstance().playUiSound(CST.AUDIO.KEYS.MENU_TRANSITION);
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
