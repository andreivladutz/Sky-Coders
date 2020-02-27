import CST from "../CST";
import ACTORS_CST, {
  ACTOR_NAMES,
  ACTOR_STATES,
  ACTOR_DIRECTIONS,
  ActorAnimConfig
} from "../ACTORS_CST";
import Phaser from "phaser";
import { IsoSprite, IsoScene } from "../IsoPlugin/IsoPlugin";

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
  isoSprite: IsoSprite;

  constructor(config: ActorConfig) {
    this.actorKey = config.actorKey;
    this.scene = config.scene;

    let { x, y, z, group, frame } = config,
      // the key of the texture this isoSprite is using is the same as the actorKey
      texture = this.actorKey;

    this.isoSprite = this.scene.add
      .isoSprite(x, y, z, texture, group, frame)
      .setOrigin(0.5, 0.75);

    this.createAnims();
  }

  walkAnim(direction: ACTOR_DIRECTIONS) {
    this.isoSprite.play(`${this.actorKey}.${ACTOR_STATES.WALK}.${direction}`);
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
          repeat: -1,
          skipMissedFrames: true
        });
      }
    }
  }
}
