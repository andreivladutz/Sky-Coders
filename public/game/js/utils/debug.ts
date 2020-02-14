import IsoPlugin from "../IsoPlugin/IsoPlugin";

export class IsoDebugger {
  coordsText: Phaser.GameObjects.Text;
  // the scene being debugged
  scene: Phaser.Scene;
  iso: IsoPlugin;

  constructor(scene: Phaser.Scene, isoInjection: IsoPlugin) {
    this.scene = scene;
    this.iso = isoInjection;
  }

  debugCoords(): IsoDebugger {
    this.coordsText = this.scene.add.text(0, 0, "");

    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      let isoPointerLocation = new Phaser.Geom.Point(pointer.x, pointer.y);
      // get the unprojected cooords from isometric(screen) space
      let pointerLocation3D = this.iso.projector.unproject(isoPointerLocation);

      // transform screen coords into board coords
      isoPointerLocation.x =
        isoPointerLocation.x -
        this.iso.projector.origin.x * this.scene.game.scale.gameSize.width;
      isoPointerLocation.y =
        isoPointerLocation.y -
        this.iso.projector.origin.y * this.scene.game.scale.gameSize.height;

      // show coords
      this.coordsText.text = `3DCoords: (x: ${pointerLocation3D.x}, y: ${pointerLocation3D.y})\nisoCoords: (x: ${isoPointerLocation.x}, y: ${isoPointerLocation.y})`;
    });

    return this;
  }
}
