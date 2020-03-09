import CST from "../CST";
import ACTORS_CST, {
  ACTOR_NAMES,
  ACTOR_STATES,
  ACTOR_DIRECTIONS,
  ActorAnimConfig
} from "../ACTORS_CST";
import Phaser from "phaser";
import { IsoScene } from "../IsoPlugin/IsoPlugin";

import IsoGameObject from "./IsoGameObject";

import ActorsManager from "./ActorsManager";

// config received by the actor config
export interface ActorConfig {
  actorKey: ACTOR_NAMES;
  // the iso scene this actor belongs to
  scene: IsoScene;
  // x position of this actor
  x: number;
  // y position of this actor
  y: number;
  // z pos
  z: number;
  // the group to add this actor to
  group?: Phaser.GameObjects.Group;
  // the current frame
  frame?: string | number;
}

export default class Actor {
  // this actor's key in the ACTORS_CST config object
  actorKey: ACTOR_NAMES;
  // the Phaser IsoScene the isoSprite belongs to
  scene: IsoScene;
  isoSprite: IsoGameObject;

  actorsManager: ActorsManager = ActorsManager.getInstance();
  // is this actor selected?
  selected: boolean = false;

  constructor(config: ActorConfig) {
    this.actorKey = config.actorKey;
    this.scene = config.scene;

    let { x, y, z, group, frame } = config,
      // the key of the texture this isoSprite is using is the same as the actorKey
      texture = this.actorKey;

    this.isoSprite = new IsoGameObject(this.scene, x, y, z, texture, frame); //.setOrigin(0.5, 0.75);

    if (config.group) {
      config.group.add(this.isoSprite);
    }

    this.createAnims();
    this.makeInteractive();

    // subscribes itself to the Actors Manager
    this.actorsManager.sceneActors.push(this);
  }

  /* Make the character:
   *  - selectable
   */

  makeInteractive() {
    this.isoSprite
      .setInteractive()
      .on("pointerover", () => {
        // TODO: stop propagating move events to the underlying board
        //event.stopPropagation();

        this.isoSprite.setTint(CST.ACTOR.SELECTION_TINT);
      })
      .on("pointerout", () => {
        if (!this.selected) {
          this.isoSprite.clearTint();
        }
      })
      .on("pointerdown", () => {
        // TODO: deselection logic?!
        this.toggleSelected();
      });
  }

  // select or deselect the actor
  toggleSelected() {
    this.selected = !this.selected;

    if (!this.selected) {
      this.isoSprite.clearTint();
    } else {
      this.actorsManager.onActorSelected(this);
      this.isoSprite.setTint(CST.ACTOR.SELECTION_TINT);
    }
  }

  walkAnim(direction: ACTOR_DIRECTIONS) {
    this.isoSprite.play(`${this.actorKey}.${ACTOR_STATES.WALK}.${direction}`);
  }

  idleAnim(direction: ACTOR_DIRECTIONS) {
    this.isoSprite.play(`${this.actorKey}.${ACTOR_STATES.IDLE}.${direction}`);
  }

  // Create all animations for this actor as stored in ACTORS_CST
  private createAnims() {
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
  }
}
