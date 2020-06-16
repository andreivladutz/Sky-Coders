export default class SVGObject extends Phaser.GameObjects.DOMElement {
  constructor(scene: Phaser.Scene, x: number, y: number, cacheKey: string) {
    super(scene, x, y);

    this.createFromCache(cacheKey);
    this.scene.add.existing(this);
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
