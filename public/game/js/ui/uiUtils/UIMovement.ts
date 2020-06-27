import Tween = Phaser.Tweens.Tween;
import GameObject = Phaser.GameObjects.GameObject;
import Scene = Phaser.Scene;
import Transform = Phaser.GameObjects.Components.Transform;
import Manager from "../../managers/Manager";
import CST from "../../CST";
import UIScene from "../../scenes/UIScene";

type MoveableGameObject = GameObject & Transform;

interface MovementTaskConfig {
  scene: Scene;
  object: MoveableGameObject;
  duration: number;
  fromDeltaX?: number;
  fromDeltaY?: number;
  toDeltaX?: number;
  toDeltaY?: number;
}

export enum MoveUIDirection {
  LEFT,
  RIGHT,
  UP,
  DOWN
}

const MOVE = CST.UI.MOVEMENT;

// an utility to simplify the enque of a movement task in a certain direction
export class MoveUIUtility {
  /**
   * Enque or start an immediate movement of the ui
   * @param scene the ui scene
   * @param object the object to be moved
   * @param direction the direction the ui object should be moved
   * @param distance how much the ui object should travel @default CST.DEFAULT_DISTANCE
   * @param enque if the movement task should be enqued or started immediately @default true
   */
  public static MoveUI(
    scene: UIScene,
    object: MoveableGameObject,
    direction: MoveUIDirection,
    enque: boolean = true,
    distance: number = MOVE.DEFAULT_DISTANCE
  ): Promise<void> {
    let toDeltaX = 0,
      toDeltaY = 0,
      fromDeltaX = 0,
      fromDeltaY = 0;

    switch (direction) {
      case MoveUIDirection.LEFT:
        toDeltaX = distance;
        break;
      case MoveUIDirection.RIGHT:
        fromDeltaX = distance;
        break;
      case MoveUIDirection.UP:
        fromDeltaY = distance;
        break;
      case MoveUIDirection.DOWN:
        toDeltaY = distance;
        break;
    }

    let config = {
        duration: MOVE.DURATION,
        toDeltaY,
        toDeltaX,
        fromDeltaX,
        fromDeltaY,
        scene,
        object
      },
      uiMovement = UIMovement.getInstance();

    if (enque) {
      return uiMovement.enque(config);
    } else {
      return uiMovement.startImmediate(config);
    }
  }
}

/**
 * movement of ui elements using tweens. Make it a Singleton
 */
export default class UIMovement extends Manager {
  queue: MovementTaskConfig[] = [];

  // queue of promise resolvers so we can communicate to the outside when
  // a movementTask from the queue has completed
  queuePromiseResolvers: (() => void)[] = [];

  queueRunning: boolean = false;

  // start a movement tween immediately
  startImmediate(config: MovementTaskConfig): Promise<void> {
    return new MovementTask(config).start();
  }

  // enque the tween to run once all other active tweens finish
  enque(config: MovementTaskConfig): Promise<void> {
    let promise: Promise<void> = new Promise(resolve => {
      this.queuePromiseResolvers.push(resolve);
    });

    this.queue.push(config);
    this.runQueue();

    return promise;
  }

  // create a separate queue of movement tasks, and return the promise that tells us when everything is finished
  public async createQueue(configs: MovementTaskConfig[]): Promise<void> {
    for (const config of configs) {
      await this.startImmediate(config);
    }
  }

  private async runQueue() {
    // This queue is already running, return
    if (this.queueRunning) {
      return;
    }

    this.queueRunning = true;

    while (this.queue.length > 0) {
      await this.startImmediate(this.queue.shift());

      // this movement task ended. resolve the promise from the outside
      this.queuePromiseResolvers.shift()();
    }

    // stopped running the queue
    this.queueRunning = false;
  }

  public static getInstance() {
    return super.getInstance() as UIMovement;
  }
}

// starts a tween moving a certain ui game object
export class MovementTask {
  tween: Tween;
  completionPromise: Promise<void>;

  constructor(config: MovementTaskConfig) {
    let { scene, object, duration } = config;

    let tweenCfg: any = {
      targets: object,
      ease: "Cubic",
      duration
    };

    let { x, y } = this.getProps(config);

    if (x) {
      tweenCfg.x = x;
    }

    if (y) {
      tweenCfg.y = y;
    }

    this.tween = scene.tweens.add(tweenCfg);

    this.tween.pause();

    this.completionPromise = new Promise(resolve => {
      this.tween.on("complete", () => {
        resolve();

        this.tween.remove();
      });
    });
  }

  // start the tween and return the promise that resolves once the tween completes
  public start(): Promise<void> {
    this.tween.resume();

    return this.completionPromise;
  }

  private getProps(config: MovementTaskConfig): MovementProps {
    let { object, toDeltaX, toDeltaY, fromDeltaX, fromDeltaY } = config;

    let x: TweenProp, y: TweenProp;
    if (toDeltaX) {
      x = {
        from: object.x,
        to: object.x - toDeltaX
      };
    } else if (fromDeltaX) {
      x = {
        from: object.x - fromDeltaX,
        to: object.x
      };
    }

    if (toDeltaY) {
      y = {
        from: object.y,
        to: object.y + toDeltaY
      };
    } else if (fromDeltaY) {
      y = {
        from: object.y + fromDeltaY,
        to: object.y
      };
    }

    return { x, y };
  }
}

interface TweenProp {
  from: number;
  to: number;
}

interface MovementProps {
  x?: TweenProp;
  y?: TweenProp;
}
