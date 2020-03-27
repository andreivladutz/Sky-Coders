import BuildingObject from "../gameObjects/BuildingObject";
import IsoArrow, { ArrowDirection } from "../utils/drawables/IsoArrow";
import IsoScene from "../IsoPlugin/IsoScene";

import UIComponent from "./UIComponent";
import CST from "../CST";
import UIScene from "../scenes/UIScene";

interface Tile {
  x: number;
  y: number;
}

// The position of each arrow in the array
const NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3;

type NORTH = 0;
type EAST = 1;
type SOUTH = 2;
type WEST = 3;

type Directions = NORTH | EAST | SOUTH | WEST;

export default class BuildPlaceUI extends UIComponent {
  // the building currently placing
  buildPlacing: BuildingObject = null;

  movementArrows: IsoArrow[];

  // indexed by the direction constants above
  arrowsTilePositions: {
    [key in Directions]?: Tile;
  } = {};

  // the function used for preventing camera panning and tile movement
  propagationPrevention = (
    _ptr: Phaser.Input.Pointer,
    _lX: number,
    _lY: number,
    event: Phaser.Types.Input.EventData
  ) => {
    event.stopPropagation();
  };

  constructor(uiScene: UIScene, gameScene: IsoScene) {
    super(uiScene, gameScene);

    this.movementArrows = [
      new IsoArrow(uiScene, gameScene, 0, 0, ArrowDirection.NORTH),
      new IsoArrow(uiScene, gameScene, 0, 0, ArrowDirection.EAST),
      new IsoArrow(uiScene, gameScene, 0, 0, ArrowDirection.SOUTH),
      new IsoArrow(uiScene, gameScene, 0, 0, ArrowDirection.WEST)
    ].map(arrow => arrow.setVisible(false));
  }

  // Enable the UI for a building
  enable(building: BuildingObject) {
    this.buildPlacing = building.enableBuildPlacing();

    this.showArrows().enableInput();
  }

  // Enable the input on the arrows and dragging of the building
  enableInput() {
    // when clicking the arrows move the building accordingly
    this.movementArrows.forEach(arrow =>
      arrow.on(CST.EVENTS.ARROWS_UI.TAP, this.buildingMovementCb.bind(this))
    );

    // enable the building for dragging
    this.gameScene.input.setDraggable(this.buildPlacing.setInteractive());

    this.buildPlacing.on("drag", (ptr: Phaser.Input.Pointer) => {
      this.buildPlacing.dragToWorldXY(ptr.worldX, ptr.worldY);
      this.showArrows();
    });

    this.overrideInput();
  }

  // prevent camera panning when dragging the building for placement
  private overrideInput() {
    this.buildPlacing.on("pointerdown", this.propagationPrevention);
    this.buildPlacing.on("pointermove", this.propagationPrevention);
  }

  // when the building is placed return the control
  private resumeInputControls() {
    this.buildPlacing.off("pointerdown", this.propagationPrevention);
    this.buildPlacing.off("pointermove", this.propagationPrevention);
  }

  // Placement arrows => each direction the building can be moved
  private showArrows(): this {
    this.computeArrowsPosition();

    for (let direction of [NORTH, SOUTH, EAST, WEST]) {
      let { x, y } = this.arrowsTilePositions[direction];
      this.movementArrows[direction].setTilePosition(x, y).setVisible(true);
    }

    return this;
  }

  // get the origins of the iso arrows (around the building) to be displayed
  private computeArrowsPosition(): this {
    let grid = this.buildPlacing.getGridAsMatrix(),
      width = grid[0].length,
      height = grid.length;

    // EAST and WEST midpoints
    let sideMidPt = Math.floor(height / 2);

    this.arrowsTilePositions[EAST] = grid[sideMidPt][width - 1];
    this.arrowsTilePositions[WEST] = grid[sideMidPt][0];

    this.arrowsTilePositions[EAST].x += CST.UI.BUILD_PLACE.ARROW_OFFSET * 2;
    this.arrowsTilePositions[WEST].x -= CST.UI.BUILD_PLACE.ARROW_OFFSET;

    // NORTH and SOUTH
    let frontMidPt = Math.floor(width / 2);

    this.arrowsTilePositions[NORTH] = grid[0][frontMidPt];
    this.arrowsTilePositions[SOUTH] = grid[height - 1][frontMidPt];

    this.arrowsTilePositions[NORTH].y -= CST.UI.BUILD_PLACE.ARROW_OFFSET * 2;
    this.arrowsTilePositions[SOUTH].y += CST.UI.BUILD_PLACE.ARROW_OFFSET;

    return this;
  }

  private buildingMovementCb(arrow: IsoArrow) {
    let deltaX = 0,
      deltaY = 0;

    switch (arrow.direction) {
      case ArrowDirection.NORTH:
        deltaY = -1;
        break;
      case ArrowDirection.SOUTH:
        deltaY = 1;
        break;
      case ArrowDirection.EAST:
        deltaX = 1;
        break;
      case ArrowDirection.WEST:
        deltaX = -1;
        break;
    }

    this.buildPlacing.moveBuilding(deltaX, deltaY);

    // update the arrows positions too
    this.showArrows();
  }
}
