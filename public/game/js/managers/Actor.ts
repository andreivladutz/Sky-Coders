import CST from "../CST";
import ACTORS_CST, {
  ACTOR_NAMES,
  ACTOR_STATES,
  ACTOR_DIRECTIONS,
  ActorAnimConfig
} from "../ACTORS_CST";
import Phaser from "phaser";
import { IsoScene } from "../IsoPlugin/IsoPlugin";

import NavSpriteObject from "./NavSpriteObject";

import ActorsManager from "./ActorsManager";
import { TileXY } from "../IsoPlugin/IsoBoard";

// config received by the actor config
export interface ActorConfig {
  actorKey: ACTOR_NAMES;
  // the iso scene this actor belongs to
  scene: IsoScene;
  // tileX position of this actor
  tileX: number;
  // tileY position of this actor
  tileY: number;
  // z pos. if not provided, 0 will be the default
  z?: number;
  // the group to add this actor to
  group?: Phaser.GameObjects.Group;
  // the current frame
  frame?: string | number;
}

export default class Actor extends NavSpriteObject {
  actorsManager: ActorsManager = ActorsManager.getInstance();

  constructor(config: ActorConfig) {
    super(
      config.actorKey,
      config.scene,
      config.tileX,
      config.tileY,
      config.z,
      config.actorKey,
      config.frame
    );

    if (config.group) {
      config.group.add(this);
    }

    this.createAnims().makeInteractive();

    // subscribes itself to the Actors Manager
    this.actorsManager.sceneActors.push(this);
  }

  /* Make the character:
   *  - selectable
   */

  makeInteractive(): this {
    this.makeSelectable().setSelectedTintColor(CST.ACTOR.SELECTION_TINT);

    // when this actor gets SELECTED
    this.on(CST.EVENTS.OBJECT.SELECT, () => {
      this.mapManager.events.on(CST.EVENTS.MAP.TAP, (tile: TileXY) => {
        this.navigateTo(tile.x, tile.y);
      });

      this.actorsManager.onActorSelected(this);
    });

    // when this actor gets DESELECTED
    this.on(CST.EVENTS.OBJECT.DESELECT, () => {
      // stop listening to tap events
      this.mapManager.events.off(CST.EVENTS.MAP.TAP);

      this.actorsManager.onActorSelected(this);
    });

    return this;
  }

  walkAnim(direction: ACTOR_DIRECTIONS): this {
    this.play(`${this.actorKey}.${ACTOR_STATES.WALK}.${direction}`);

    return this;
  }

  idleAnim(direction: ACTOR_DIRECTIONS): this {
    this.play(`${this.actorKey}.${ACTOR_STATES.IDLE}.${direction}`);

    return this;
  }

  // Create all animations for this actor as stored in ACTORS_CST
  private createAnims(): this {
    // animation object with all the possible animation states
    let animsObject: { [key: string]: ActorAnimConfig } =
      ACTORS_CST[this.actorKey].anims;

    // take each state i.e. WALK, IDLE...
    for (let STATE in ACTOR_STATES) {
      let animation: ActorAnimConfig = animsObject[STATE];

      if (typeof animation === "undefined") {
        continue;
      }

      // generate an animation for each direction of this state
      for (let DIRECTION in ACTOR_DIRECTIONS) {
        // check if this DIRECTION exists (Idle anims might not have all 8 directions. only 4)
        if (typeof animation.DIRECTIONS[DIRECTION] === "undefined") {
          continue;
        }

        // generate the frames for this actor's scene
        // the actorKey is also the key name of the texture
        let frameNames = this.scene.anims.generateFrameNames(this.actorKey, {
          start: animation.start,
          end: animation.end,
          zeroPad: animation.zeroPad,
          prefix: animation.prefix + animation.DIRECTIONS[DIRECTION],
          suffix: animation.suffix
        });

        this.scene.anims.create({
          key: `${animation.animationKey}.${DIRECTION}`,
          frames: frameNames,
          frameRate: ACTORS_CST.frameRate,
          repeat: -1
        });
      }
    }
    return this;
  }
}
