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
  // this actor's key in the ACTORS_CST config object
  actorKey: ACTOR_NAMES;

  actorsManager: ActorsManager = ActorsManager.getInstance();
  // is this actor selected?
  selected: boolean = false;

  constructor(config: ActorConfig) {
    super(
      config.scene,
      config.tileX,
      config.tileY,
      config.z,
      config.actorKey,
      config.frame
    );

    this.actorKey = config.actorKey;

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
    this.setInteractive()
      .on("pointerover", () => {
        // TODO: stop propagating move events to the underlying board
        //event.stopPropagation();

        this.setTint(CST.ACTOR.SELECTION_TINT);
      })
      .on("pointerout", () => {
        if (!this.selected) {
          this.clearTint();
        }
      })
      .on("pointerdown", () => {
        // TODO: deselection logic?!
        this.toggleSelected();
      });

    return this;
  }

  // select or deselect the actor
  toggleSelected() {
    this.selected = !this.selected;

    if (!this.selected) {
      this.clearTint();
    } else {
      this.navigateTo(50, 50);

      this.actorsManager.onActorSelected(this);
      this.setTint(CST.ACTOR.SELECTION_TINT);
    }
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
