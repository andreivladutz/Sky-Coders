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

import ActorsManager from "../managers/ActorsManager";
import { TileXY } from "../map/IsoBoard";
import CharacterTerminal from "../Blockly/CharacterTerminal";
import CodeInterpreter from "../Blockly/CodeInterpreter";
import { GridColor } from "./IsoSpriteObject";

// mapping event to directions
const WALK_EV = CST.NAV_OBJECT.EVENTS.WALKING,
  DIR = ACTOR_DIRECTIONS,
  EVENT_TO_DIRECTION = {
    [WALK_EV.E]: DIR.EAST,
    [WALK_EV.W]: DIR.WEST,
    [WALK_EV.N]: DIR.NORTH,
    [WALK_EV.S]: DIR.SOUTH,
    [WALK_EV.SE]: DIR.SE,
    [WALK_EV.NE]: DIR.NE,
    [WALK_EV.NW]: DIR.NW,
    [WALK_EV.SW]: DIR.SW
  },
  // mapping 8 directions to 4
  DIRECTION8_TO_DIRECTION4 = {
    [DIR.SW]: DIR.SW,
    [DIR.NE]: DIR.NE,
    [DIR.SE]: DIR.SE,
    [DIR.SOUTH]: DIR.SE,
    [DIR.EAST]: DIR.SE,
    [DIR.NW]: DIR.NW,
    [DIR.NORTH]: DIR.NE,
    [DIR.WEST]: DIR.SW
  };

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
  private actorsManager: ActorsManager = ActorsManager.getInstance();

  private walking: boolean = false;
  private direction: ACTOR_DIRECTIONS = ACTOR_DIRECTIONS.SE;

  // If a walking cycle is initiated from code, don't let the user change the direction
  private walkingFromCode: boolean = false;

  // Each character has its terminal
  public terminal: CharacterTerminal;
  // Each character has its interpreter
  public interpreter: CodeInterpreter;
  // Each character has its blockly code
  public blocklyCode: string = "";

  constructor(config: ActorConfig) {
    super(
      config.actorKey,
      config.scene,
      config.tileX,
      config.tileY,
      config.z,
      CST.LAYERS.ACTOR_ID,
      config.actorKey,
      config.frame
    );

    if (config.group) {
      config.group.add(this);
    }

    this.createAnims().makeInteractive();

    // subscribes itself to the Actors Manager
    this.actorsManager.sceneActors.push(this);

    this.terminal = new CharacterTerminal(this.actorKey);
    this.interpreter = new CodeInterpreter(this);
  }

  public focusCamera(): this {
    this.mapManager.setScrollOverTiles(this.tileX, this.tileY);

    return this;
  }

  // Keep it as a separate function so we can then remove the listener
  navigationHandler = (tile: TileXY) => {
    if (!this.tileCoordsOnThisGrid(tile.x, tile.y) && !this.walkingFromCode) {
      this.navigateTo(tile.x, tile.y);
    }
  };

  // Handle a navigation request from Blockly code.
  // While walking from code user walk commands are disabled
  public navigationBlocklyHandler(x: number, y: number): Promise<any> {
    // Promise that resolves once the character reached its destination
    let navigationEnded = new Promise(resolve => {
      this.once(CST.NAV_OBJECT.EVENTS.IDLE, () => {
        this.walkingFromCode = false;

        resolve();
      });
    });

    this.walkingFromCode = true;
    this.navigateTo(x, y);

    return navigationEnded;
  }

  /* Make the character:
   *  - selectable
   */
  makeInteractive(): this {
    this.makeSelectable().setSelectedTintColor(CST.ACTOR.SELECTION_TINT);

    // when this actor gets SELECTED
    this.on(CST.EVENTS.OBJECT.SELECT, () => {
      this.mapManager.events.on(CST.EVENTS.MAP.TAP, this.navigationHandler);

      // Pick a random grid color
      let randomColor = Phaser.Math.RND.pick([
        GridColor.YELLOW,
        GridColor.ORANGE,
        GridColor.BLUE,
        GridColor.NEUTRAL_GREEN,
        GridColor.PURPLE,
        GridColor.PINK
      ]);
      this.enableGridDrawing(randomColor);

      this.actorsManager.onActorSelected(this);
    });

    // when this actor gets DESELECTED
    this.on(CST.EVENTS.OBJECT.DESELECT, () => {
      // stop listening to tap events
      this.mapManager.events.off(CST.EVENTS.MAP.TAP, this.navigationHandler);

      // Disable the grid
      this.disableGridDrawing();

      this.actorsManager.onActorDeselected(this);
    });

    // play walk animation on walk event:
    Object.entries(EVENT_TO_DIRECTION).forEach(([event, direction]) => {
      this.on(event, () => {
        this.walkAnim(direction);
      });
    });

    // play idle anims when the actor stop walking
    this.on(CST.NAV_OBJECT.EVENTS.IDLE, this.idleAnim, this);

    return this;
  }

  // override the deselect function
  deselect(pointer?: Phaser.Input.Pointer) {
    // if no pointer is provided just deselect
    if (!pointer) {
      super.deselect();
    }

    // check if the pointer is above the object's grid only to deselect
    let { x, y } = this.mapManager.worldToTileCoords(
      pointer.worldX,
      pointer.worldY
    );

    if (this.tileCoordsOnThisGrid(x, y)) {
      super.deselect();
    }
  }

  // Play the walking animation in the provided direction
  walkAnim(direction: ACTOR_DIRECTIONS): this {
    // if the actor is already walking we want to keep the progress of the animation
    // not "begining to walk" again
    let progress = 0;
    let nextAnimKey = `${this.actorKey}.${ACTOR_STATES.WALK}.${direction}`;

    if (this.walking) {
      // Already playig the same animation, return
      if (this.anims.getCurrentKey() === nextAnimKey) {
        return this;
      }

      progress = this.anims.getProgress();
    }

    this.play(nextAnimKey);

    this.anims.setProgress(progress);

    this.walking = true;
    this.direction = direction;

    return this;
  }

  // Play the idle animation in the provided direction
  idleAnim(direction?: ACTOR_DIRECTIONS): this {
    this.walking = false;

    if (!direction) {
      // get the current direction mapped to the only 4 directions of the idle anims
      direction = DIRECTION8_TO_DIRECTION4[this.direction];
    }

    this.play(`${this.actorKey}.${ACTOR_STATES.IDLE}.${direction}`);

    this.direction = direction;

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
          repeat: -1,
          skipMissedFrames: false
        });
      }
    }
    return this;
  }
}
