import CST from "../../CST";

export default class SVGObject extends Phaser.GameObjects.DOMElement {
  // Importing Illustrator SVGs needs classes' numbers changed
  private static lastUsedClass: number = 0;
  // Each svg will have ids appended with their instance id to make them unique
  private static instances: number = 0;
  private static readonly uniqueStringAppend = "SVG";

  constructor(scene: Phaser.Scene, x: number, y: number, cacheKey: string) {
    super(scene, x, y);

    this.createFromHTML(this.processSVGText(scene.cache.html.get(cacheKey)));
    this.scene.add.existing(this);
    this.node.classList.add(CST.UI.SVG.DEFAULT_CLASS);

    SVGObject.instances++;
  }

  public setVisible(visible: boolean): this {
    (this.node as HTMLElement).style.visibility = visible
      ? "visible"
      : "hidden";

    return this;
  }

  // Prevent class numbers from colliding
  private processSVGText(svg: string): string {
    let maxClassNumber = 0;

    // Make sure each class is iterated once
    function* iterateMatches() {
      let classSet = new Set();
      let matchIterator = svg.matchAll(/cls-\d+/g);

      for (let match of matchIterator) {
        let matchString = match[0];

        if (classSet.has(matchString)) {
          continue;
        }

        yield matchString;
        classSet.add(matchString);
      }
    }

    for (let match of iterateMatches()) {
      let currClassNo = parseInt(match.substr(4));
      maxClassNumber = Math.max(maxClassNumber, currClassNo);

      let newClassNo = currClassNo + SVGObject.lastUsedClass;
      // Replace the matched cls-*number* but make sure the number is not part of a bigger number
      svg = svg.replace(
        new RegExp(`${match}(?!\\d)`, "g"),
        `class_${newClassNo}`
      );
    }

    SVGObject.lastUsedClass += maxClassNumber;
    return this.makeIdsUnique(svg);
  }

  // Make all imported svg ids unique
  private makeIdsUnique(svg: string): string {
    // Identify each clip-path id
    let clipPaths = new Set(svg.match(/clip-path(-\d+)?/g));

    for (let clipPath of clipPaths) {
      // Replace the matched clip-path but make sure it's only the ids
      let idRegex = new RegExp(`${clipPath}(?!-)(?!\\d)(?!:)`, "g");
      svg = svg.replace(
        idRegex,
        `${clipPath}${SVGObject.uniqueStringAppend}${SVGObject.instances}`
      );
    }

    return svg;
  }

  public setWidth(width: number): this {
    (this.node as SVGElement).style.width = `${width}px`;

    return this;
  }

  public setHeight(height: number): this {
    (this.node as SVGElement).style.height = `${height}px`;

    return this;
  }
}
