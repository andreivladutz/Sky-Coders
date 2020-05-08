import KDBush from "kdbush";
import Sprite = Phaser.GameObjects.Sprite;
import Rectangle = Phaser.Geom.Rectangle;
import BoundsComponent = Phaser.GameObjects.Components.GetBounds;

// A point of the 4 corners of a bounding box
interface ObjectBboxPoint<T> {
  x: number;
  y: number;
  objectRef: T;
}

/**
 * A KD Tree that stores static objects' bounding boxes
 * Used for easily getting the objects in view
 */
export default class BboxKDStorage<T extends BoundsComponent> {
  // a KD-tree which hold the margin points of an object's bbox
  objectsIndex: KDBush<ObjectBboxPoint<T>>;
  // The bounds points indexed of all objects
  indexedObjectPts: ObjectBboxPoint<T>[] = [];

  /**
   * Receive an array of game objects derived from sprite and index them
   * for fast retrieval
   * @param objects The array of Sprite-derived Objects
   */
  constructor(objects: T[]) {
    let bounds = new Rectangle();

    for (let object of objects) {
      object.getBounds(bounds);

      let pts = [
        [bounds.x, bounds.y],
        [bounds.x + bounds.width, bounds.y],
        [bounds.x, bounds.y + bounds.height],
        [bounds.x + bounds.width, bounds.y + bounds.height]
      ];

      for (let [x, y] of pts) {
        this.indexedObjectPts.push({ x, y, objectRef: object });
      }
    }

    this.initKDBush();
  }

  public initKDBush() {
    // index the midPoints of each tile so they are easily found within the viewRect
    this.objectsIndex = new KDBush(
      this.indexedObjectPts,
      (p: ObjectBboxPoint<T>) => p.x,
      (p: ObjectBboxPoint<T>) => p.y
    );
  }

  // returns an array of (x, y) pairs that are the tile coordinates of the viewable tiles
  public getObjectsInView(viewRect: Rectangle): Set<T> {
    // search in the KD-Tree what objects are within the view area
    return new Set(
      this.objectsIndex
        .range(
          viewRect.x,
          viewRect.y,
          viewRect.x + viewRect.width,
          viewRect.y + viewRect.height
        )
        .map((id: number) => this.indexedObjectPts[id])
        .map(({ objectRef }) => objectRef)
    );
  }
}
