import { Shape, Board } from "phaser3-rex-plugins/plugins/board-components.js";

interface RexChess {
  setBlocker: (value?: boolean) => void;
}

export default class BlockerFactory {
  private static instance: BlockerFactory = null;
  board: Board;

  // the board all these blockers will belong to
  private constructor(board: Board) {
    this.board = board;
  }

  public addBlockerTile(tileX: number, tileY: number, tileZ: number = 0) {
    return new BlockerTile(this.board, tileX, tileY, tileZ);
  }

  public static getInstance(board?: Board) {
    if (this.instance === null) {
      if (!board) {
        throw new Error(
          "A Board instance must be provided to this BlockerFactory on first instantiation"
        );
      }
      this.instance = new BlockerFactory(board);
    }

    return this.instance;
  }
}

// A GameObject that has the shape of a tile, used only to mark blocked tiles on the map
// not being added to the scene, so no rendering / updating
export class BlockerTile extends Shape {
  rexChess: RexChess;

  constructor(board: Board, tileX: number, tileY: number, tileZ: number) {
    super(board, tileX, tileY, tileZ);

    this.rexChess.setBlocker(true);
  }
}
