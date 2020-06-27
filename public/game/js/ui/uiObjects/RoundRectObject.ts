import CST from "../../CST";
import DOMElement = Phaser.GameObjects.DOMElement;

function hexaColor(color: number) {
  return "#" + color.toString(16);
}

export default class RoundRectObject extends DOMElement {
  /**
   * Creates a rounded div rectangle
   * @param scene
   * @param x position
   * @param y position
   * @param width size
   * @param height size
   * @param color any valid css color
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width?: number,
    height?: number,
    color: number | string = CST.UI.ROUND_RECT.DEFAULT_COLOR,
    borderRadius: number = CST.UI.ROUND_RECT.DEFAULT_RADIUS
  ) {
    super(scene, x, y, "div", {
      ...CST.UI.ROUND_RECT.DEFAULT_STYLE,
      width: width ? `${width}px` : undefined,
      height: height ? `${height}px` : undefined,
      "background-color": `${
        typeof color === "number" ? hexaColor(color) : color
      }`,
      "border-radius": `${borderRadius}%`
    });

    this.scene.add.existing(this);
  }

  public setTextWithStyle(
    text: string,
    fontSize?: number,
    fontFamily?: string,
    color?: number | string
  ): this {
    let htmlStyle = (this.node as HTMLElement).style;

    if (fontSize) {
      htmlStyle.fontSize = `${fontSize}px`;
    }
    if (fontFamily) {
      htmlStyle.fontFamily = fontFamily;
    }
    if (typeof color === "number") {
      htmlStyle.color = hexaColor(color);
    } else if (typeof color === "string") {
      htmlStyle.color = color;
    }

    return this.setText(text);
  }

  public setPadding(size: number, lateral: boolean = false): this {
    let htmlStyle = (this.node as HTMLElement).style;

    if (lateral) {
      htmlStyle.paddingLeft = htmlStyle.paddingRight = `${size}px`;
    } else {
      htmlStyle.padding = `${size}px`;
    }

    return this;
  }

  public addDOMChild(child: DOMElement | Element, first = false): this {
    if (child instanceof DOMElement) {
      child = child.node;
    }

    if (first) {
      this.node.prepend(child);
    } else {
      this.node.appendChild(child);
    }

    (child as HTMLElement).style.position = "relative";
    (child as HTMLElement).style.display = "inline-block";

    return this;
  }
}
