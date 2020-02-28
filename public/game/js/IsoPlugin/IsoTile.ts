import Phaser from "phaser";
import { Projector, IsoScene, Point3 } from "./IsoPlugin";
import IsoBoard from "./IsoBoard";

export default class IsoTile extends Phaser.GameObjects.Image {
  projector: Projector;
  // also keep the tile coords in the tilemap
  tileX: number;
  tileY: number;

  constructor(
    scene: IsoScene,
    x: number,
    y: number,
    tileX: number,
    tileY: number,
    texture: string,
    frame?: string | integer
  ) {
    super(scene, x, y, texture, frame);

    this.tileX = tileX;
    this.tileY = tileY;

    this.projector = scene.iso.projector;
    this.set3DPosition(this.x, this.y, 0);
  }

  set3DPosition(x: number, y: number, z: number): this {
    let projectedPos = this.projector.project(new Point3(x, y, z));

    this.x = projectedPos.x;
    this.y = projectedPos.y;

    return this;
  }

  setTilePosition(tileX: number, tileY: number): this {
    this.tileX = tileX;
    this.tileY = tileY;

    return this;
  }

  // this tile checks itself if it is contained in the view of an isoBoard
  inView(isoBoard: IsoBoard): boolean {
    return isoBoard.isTileInView({ x: this.tileX, y: this.tileY });
  }
}
