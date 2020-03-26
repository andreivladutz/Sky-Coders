import BuildingObject from "../gameObjects/BuildingObject";
import IsoArrow, { ArrowDirection } from "../utils/drawables/IsoArrow";
import IsoScene from "../IsoPlugin/IsoScene";

import UIComponent from "./UIComponent";
import CST from "../CST";

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

  movementArrows: IsoArrow[] = [
    new IsoArrow(this.scene, 0, 0, ArrowDirection.NORTH).setVisible(false),
    new IsoArrow(this.scene, 0, 0, ArrowDirection.EAST).setVisible(false),
    new IsoArrow(this.scene, 0, 0, ArrowDirection.SOUTH).setVisible(false),
    new IsoArrow(this.scene, 0, 0, ArrowDirection.WEST).setVisible(false)
  ];

  // indexed by the direction constants above
  arrowsTilePositions: {
    [key in Directions]?: Tile;
  } = {};

  constructor(scene: IsoScene) {
    super(scene);
  }

  // Enable the UI for a building
  enable(building: BuildingObject) {
    this.buildPlacing = building;

    this.processBuilding();
    this.showArrows();
  }

  // Placement arrows => each direction the building can be moved
  showArrows() {
    for (let direction of [NORTH, SOUTH, EAST, WEST]) {
      let { x, y } = this.arrowsTilePositions[direction];
      this.movementArrows[direction].setTilePosition(x, y).setVisible(true);
    }
  }

  // get the origins of the iso arrows to be displayed
  private processBuilding() {
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
  }
}
