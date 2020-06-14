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
import { GridColor } from "./IsoSpriteObject";
import ActorCodeHandler from "./ActorCodeHandler";
import CameraManager from "../managers/CameraManager";

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
  // The position of this actor in the server-side db
  dbArrayPos: number;
}

export default class Actor extends NavSpriteObject {
  private actorsManager: ActorsManager = ActorsManager.getInstance();

  private walking: boolean = false;
  private direction: ACTOR_DIRECTIONS = ACTOR_DIRECTIONS.SE;
  // If a walking cycle is initiated from code, don't let the user change the direction
  private walkingFromCode: boolean = false;

  private dbArrayPos: number;

  public codeHandler: ActorCodeHandler;

  constructor(config: ActorConfig) {
    super({
      ...config,
      // Place the actors at different rexBoard's tileZ coords so they don't collide
      tileZ: ActorsManager.getInstance().sceneActors.length + 1,
      objectId: CST.LAYERS.ACTOR_ID,
      texture: config.actorKey
    });

    if (config.group) {
      config.group.add(this);
    }

    this.dbArrayPos = config.dbArrayPos;

    this.createAnims().makeInteractive();

    // subscribes itself to the Actors Manager
    this.actorsManager.sceneActors.push(this);
    this.codeHandler = new ActorCodeHandler(this);

    this.idleAnim();
  }

  public focusCamera(): this {
    this.mapManager.setScrollOverTiles(this.tileX, this.tileY);
    CameraManager.getInstance().camera.zoomTo(1, CST.ACTOR.FOCUS_ZOOM_TIME);

    return this;
  }

  // Keep it as a separate function so we can then remove the listener
  private navigationHandler = (tile: TileXY) => {
    if (!this.tileCoordsOnThisGrid(tile.x, tile.y) && !this.walkingFromCode) {
      this.navigateTo(tile.x, tile.y);
    }
  };

  private firstTapHandler: (t: TileXY, p: Phaser.Input.Pointer) => void = null;
  // We need the closure
  private createFirstTapHandler(downX: number, downY: number) {
    this.firstTapHandler = (tile: TileXY, tapPointer: Phaser.Input.Pointer) => {
      let tapX = Math.floor(tapPointer.worldX);
      let tapY = Math.floor(tapPointer.worldY);

      // TapPointer === pointer if the same pointer that fires the selection fires a map tap too
      if (tapX !== downX || tapY !== downY) {
        this.navigationHandler(tile);
      }

      this.mapManager.events.on(CST.EVENTS.MAP.TAP, this.navigationHandler);
    };
  }

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

  // Overriden setTilePosition that also move the actor on the rexBoard
  public setTilePosition(tileX: number, tileY: number): this {
    super.setTilePosition(tileX, tileY);

    this.mapManager.moveSpriteObjectToTiles(this, tileX, tileY, this.tileZ);
    return this;
  }

  /* Make the character:
   *  - selectable
   */
  makeInteractive(): this {
    this.makeSelectable().setSelectedTintColor(CST.ACTOR.SELECTION_TINT);
    this.pressCancelsSelection = true;

    this.on(CST.EVENTS.OBJECT.PRESS, async (pointer: Phaser.Input.Pointer) => {
      let charaUI = this.actorsManager.charaUI;

      if (!charaUI) {
        charaUI = await this.actorsManager.initCharaUI(this);
      }

      charaUI.showCommandsMenu(this, pointer.x, pointer.y);
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
  public deselect(pointer?: Phaser.Input.Pointer) {
    // if no pointer is provided just deselect
    // fired by the actorsmanager
    if (!pointer) {
      super.deselect();
      return this.onDeselected();
    }

    // check if the pointer is above the object's grid only to deselect
    let { x, y } = this.mapManager.worldToTileCoords(
      pointer.worldX,
      pointer.worldY
    );

    if (this.tileCoordsOnThisGrid(x, y)) {
      super.deselect();
      this.onDeselected();
    }
  }

  public select(pointer: Phaser.Input.Pointer) {
    super.select(pointer);
    this.onSelected(pointer);
  }

  // After this actor gets DESELECTED
  private onDeselected() {
    this.mapManager.events.off(CST.EVENTS.MAP.TAP, this.firstTapHandler);
    // stop listening to tap events
    this.mapManager.events.off(CST.EVENTS.MAP.TAP, this.navigationHandler);
    // Disable the grid
    this.disableGridDrawing();

    this.actorsManager.onActorDeselected();
  }

  private onSelected(pointer: Phaser.Input.Pointer) {
    let downX = Math.floor(pointer.worldX);
    let downY = Math.floor(pointer.worldY);
    this.createFirstTapHandler(downX, downY);

    // First make sure we prevent a navigation tap the same time the actor is selected
    this.mapManager.events.once(CST.EVENTS.MAP.TAP, this.firstTapHandler);

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
