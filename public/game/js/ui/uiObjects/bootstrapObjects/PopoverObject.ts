import IsoScene from "../../../IsoPlugin/IsoScene";
import $ from "jquery";
import "bootstrap/js/dist/popover";

import CST from "../../../CST";

const { POPOVER } = CST.UI;

// An <a> tag used with bootstrap to create a popover for the game
// Also, the popover is a singleton object as it displayed only once
export default class PopoverObject extends Phaser.GameObjects.DOMElement {
  private static instance: PopoverObject = null;
  private isVisible: boolean = false;

  private constructor(gameScene: IsoScene, x: number, y: number) {
    super(gameScene, x, y, POPOVER.HTML_ELEMENT, POPOVER.DEFAULT_STYLE);

    this.setDepth(CST.UI.HTML_LAYER.POPOVER).setInitialAttribs();
    this.scene.add.existing(this);

    // Enable html insertion into the popover content
    $(() => {
      $(CST.UI.POPOVER.QUERY).popover({
        html: true,
      });
    });

    this.scene.events.on("update", this.updatePosition, this);
  }

  // Update the popover's position regularly when it is visible
  private updatePosition() {
    if (!this.isVisible) {
      return;
    }

    $(() => {
      $(CST.UI.POPOVER.QUERY).popover("update");
    });
  }

  private setInitialAttribs(): this {
    for (let [attrib, value] of Object.entries(POPOVER.INIT_ATTRIBS)) {
      this.node.setAttribute(attrib, value);
    }

    return this;
  }

  // The title and the content of the popover
  public showPopover(title: string, content: string): this {
    this.node.setAttribute(POPOVER.TITLE_ATTRIB, title);
    this.node.setAttribute(POPOVER.CONTENT_ATTRIB, content);

    $(() => {
      $(CST.UI.POPOVER.QUERY).popover("show");
    });

    this.isVisible = true;

    return this;
  }

  public updateContent(content: string): this {
    $(".popover-body").text(content);

    return this;
  }

  public hidePopover(): this {
    $(() => {
      $(CST.UI.POPOVER.QUERY).popover("hide");
    });
    this.isVisible = false;

    return this;
  }

  public static getInstance(
    gameScene: IsoScene,
    x: number,
    y: number
  ): PopoverObject {
    if (!this.instance) {
      this.instance = new PopoverObject(gameScene, x, y);
    } else {
      this.instance.x = x;
      this.instance.y = y;
    }

    return this.instance;
  }
}
