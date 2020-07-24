import GameComponent from "../GameComponent";
import IsoSpriteObject from "../../gameObjects/IsoSpriteObject";
import StateMachine from "../../utils/StateMachine";
import CST from "../../CST";

import Pointer = Phaser.Input.Pointer;
import EventData = Phaser.Types.Input.EventData;
import SYSTEM from "../../system/system";

const ST = CST.INPUT_STATES;
enum EventNames {
  out = "out",
  over = "over",
  move = "move",
  down = "down",
  // On desktop: right mouse button
  rightdown = "rightdown",
  up = "up",
  drag = "drag",
}

// The config object setting the internal input component's behaviour
export interface InputComponentCfg {
  // Enable or not long hover
  longHoverEnabled: boolean;
  // Long hover time (focused to long hover)
  longHoverTime?: number;

  pressEnabled: boolean;
  pressTime?: number;

  // Enabling the drag also enables the object for the scene's dragging input
  dragEnabled: boolean;
}

// Uniform event handler
export type EventHandler = (ptr?: Pointer, e?: EventData) => void;

type TransitionsConfig = {
  // The event that determines the transition to another state (the string is the name of the state)
  // onCanvas means the event was launched strictly on canvas
  // notCanvas means strictly not on canvas
  // any we don't care where it launched
  [Event in EventNames]?: {
    onCanvas?: string;
    notCanvas?: string;
    any?: string;
  };
};

// One state in the state machine
interface EventStateConfig extends TransitionsConfig {
  // If the transitioning in the state emits an event
  emitsEvent: boolean;

  // A timeout transition -> transition to another state when a certain time runs out
  timeOut?: {
    // timeout time
    time: number;
    // the transition state
    to: string;
    // hold the setTimeout's id to cancel it if the state exits before the timeout fires
    timeoutId?: any;
    // Store the last known pointer when entering a state with a timeout transition
    lastPointer?: Pointer;
  };
  // Immediately transition to another state (to the state with the provided name)
  immediate?: string;
  // Optional predicate to check if the transition should be made or not
  conditionChecker?: (inputComponent: InputComponent, ptr?: Pointer) => boolean;
}

// States configs indexed by each state's name
type StatesConfig = {
  [StateName: string]: EventStateConfig;
};

// Args passed to the input handler for pointer* move, over, down, up
type InputArgs = [Pointer, number, number, EventData];
// args for the pointerout
type PointeroutArgs = [Pointer, EventData];
// args for the drag event
type DragArgs = [Pointer, number, number];

export default class InputComponent extends GameComponent {
  protected get scene() {
    return this.parentObject.scene;
  }
  protected stateMachine: StateMachine<InputComponent>;

  // Keep the config so we can look in it later
  protected statesConfig: StatesConfig;
  // Keep this component's config
  public config: InputComponentCfg;

  // Restraining the event registering
  public on(eventName: string, handler: EventHandler): this {
    return super.on(eventName, handler);
  }

  public constructor(parent: IsoSpriteObject, config: InputComponentCfg) {
    super(parent);

    this.config = config;

    if (config.dragEnabled) {
      this.scene.input.setDraggable(parent);
    }

    this.initEventHandlers().initInputStates();
  }

  // Set the game object as interactive
  public onInteractive(): this {
    this.parentObject.setInteractive();

    return this;
  }

  // Turn off interactive temporarily
  public offInteractive(): this {
    this.parentObject.disableInteractive();

    return this;
  }

  // Destroy the interactive state
  // And remove ALL listeners
  public destroyInteractive() {
    this.parentObject.removeInteractive();
    this.parentObject.removeAllListeners();
  }

  // Know if a fired event was above the canvas or other dom elements
  protected gameCanvasIsTarget(ptr: Pointer) {
    return ptr.event.target === this.scene.game.canvas;
  }

  // The handler event for all events
  protected eventHandler(eventName: EventNames, ...args: any[]) {
    let ptr: Pointer, evData: EventData;

    switch (eventName) {
      case EventNames.move:
      case EventNames.over:
      case EventNames.down:
      case EventNames.up:
      case EventNames.rightdown:
        [ptr, , , evData] = args as InputArgs;
        break;

      case EventNames.out:
        [ptr, evData] = args as PointeroutArgs;
        break;

      case EventNames.drag:
        [ptr] = args as DragArgs;
        break;
    }

    // Check if any transition can be made from the current state with the caught event
    this.eventTransition(eventName, ptr, evData);
  }

  protected initEventHandlers(): this {
    const handler = this.eventHandler;
    this.parentObject.on("pointermove", handler.bind(this, EventNames.move));
    this.parentObject.on("pointerover", handler.bind(this, EventNames.over));
    this.parentObject.on(
      "pointerdown",
      (ptr: Pointer, lx: number, ly: number, e: EventData) => {
        if (ptr.rightButtonDown()) {
          return this.eventHandler(EventNames.rightdown, ptr, lx, ly, e);
        }

        this.eventHandler(EventNames.down, ptr, lx, ly, e);
      }
    );
    this.parentObject.on("pointerup", handler.bind(this, EventNames.up));
    this.parentObject.on("pointerout", handler.bind(this, EventNames.out));
    this.parentObject.on("drag", handler.bind(this, EventNames.drag));

    return this;
  }

  /**
   * Check if a transition should be made to another transition and then transition
   * @param to state name
   * @param ptr and @param evData payload to be passed along
   */
  protected transitionChecker(to: string, ptr: Pointer, evData?: EventData) {
    let toStateCfg = this.statesConfig[to];

    // If there is a custom condition checker, check with it
    if (
      toStateCfg.conditionChecker &&
      !toStateCfg.conditionChecker(this, ptr)
    ) {
      return false;
    }

    console.log(
      "transitioning from " +
        this.stateMachine.getCurrState().name +
        " to " +
        to
    );
    this.stateMachine.transitionTo(to, ptr, evData);

    return true;
  }

  // Check if the caught event can trigger a state transition
  protected eventTransition(reason: EventNames, ptr: Pointer, ev: EventData) {
    const currState = this.stateMachine.getCurrState();
    const currStateCfg = this.statesConfig[currState.name];

    if (!currStateCfg[reason]) {
      return;
    }

    let toState: string;
    // The event was fired, do not care if on canvas or other dom elements
    if ((toState = currStateCfg[reason].any)) {
      if (this.transitionChecker(toState, ptr, ev)) {
        return;
      }
    }

    // The caught event was fired on canvas, transition to *toState*
    if (
      (toState = currStateCfg[reason].onCanvas) &&
      this.gameCanvasIsTarget(ptr)
    ) {
      if (this.transitionChecker(toState, ptr, ev)) {
        return;
      }
    }

    if (
      (toState = currStateCfg[reason].notCanvas) &&
      !this.gameCanvasIsTarget(ptr)
    ) {
      if (this.transitionChecker(toState, ptr, ev)) {
        return;
      }
    }
  }

  // For the timeout transition we do not have a pointer object passed along, so just pass the last known pointer if existing
  protected timeoutTransition(from: string, to: string, lastPointer: Pointer) {
    let currState = this.stateMachine.getCurrState();
    let currStateCfg = this.statesConfig[from];

    // If the state changed (in case of the timeout transition)
    if (currState.name !== from || currStateCfg.timeOut.to !== to) {
      return;
    }

    this.transitionChecker(to, lastPointer);
  }

  protected parseStatesConfig(statesConfig: StatesConfig): this {
    this.statesConfig = statesConfig;

    for (let [stateName, config] of Object.entries(statesConfig)) {
      this.addStateToSM(stateName, config);
    }

    return this;
  }

  protected addStateToSM(stateName: string, config: EventStateConfig) {
    let onEnter: () => void = null;
    let onExit: () => void = null;

    // Small hack, transforming immediate to no time timeOut
    if (config.immediate) {
      config.timeOut = {
        to: config.immediate,
        time: 0,
      };
    }

    // A timeout transition to another state
    if (config.timeOut) {
      onEnter = function() {
        config.timeOut.timeoutId = setTimeout(() => {
          let self = this as InputComponent;
          // The current state could change until the time runs out, so checks have to be made
          self.timeoutTransition(
            stateName,
            config.timeOut.to,
            config.timeOut.lastPointer
          );
        }, config.timeOut.time);
      };

      // Cancel the timeout if the state exits before it fires
      onExit = function() {
        if (config.timeOut.timeoutId) {
          clearTimeout(config.timeOut.timeoutId);
        }
      };
    }

    let state = this.stateMachine.addState({
      name: stateName,
      onEnter,
      onExit,
    });

    // Check if the transitioning to state is final i.e. emits an event
    let getTransitionCb = (toState: string) =>
      function(ptr: Pointer, evData: EventData) {
        const self = this as InputComponent;
        const toStateCfg = self.statesConfig[toState];

        // The emitted event has the name of the state that's been transitioned to
        if (toStateCfg.emitsEvent) {
          self.emit(toState, ptr, evData);
        }

        // If the state we are transitioning to has a timeout transition,
        // place the last pointer inside it so it can be passed along if that transition happens
        if (toStateCfg.timeOut) {
          toStateCfg.timeOut.lastPointer = ptr;
        }
      };

    if (config.timeOut) {
      state.addTransition(
        config.timeOut.to,
        getTransitionCb(config.timeOut.to)
      );
    }

    // if (config.immediate) {
    //   state.addTransition(config.immediate, getTransitionCb(config.immediate));
    // }

    // Check if we have transitions to other states
    for (let ev of Object.values(EventNames)) {
      if (!config[ev]) {
        continue;
      }
      for (let transCond of ["onCanvas", "notCanvas", "any"]) {
        if (!config[ev][transCond]) {
          continue;
        }

        let toState = config[ev][transCond];

        state.addTransition(toState, getTransitionCb(toState));
      }
    }
  }

  // Take a state config and append the transitions to the unfocused state
  // Does NOT override the existing transitions
  protected toUnfocusedConfig(config: EventStateConfig): EventStateConfig {
    const E = EventNames;

    if (!config[E.down]) {
      config[E.down] = {};
    }
    if (!config[E.up]) {
      config[E.up] = {};
    }
    if (!config[E.move]) {
      config[E.move] = {};
    }
    if (!config[E.out]) {
      config[E.out] = {};
    }

    // Any interaction with a dom element above the canvas cancels the focus
    if (!config[E.down].any) {
      config[E.down].notCanvas = config[E.down].notCanvas || ST.UNFOCUSED;
    }
    if (!config[E.up].any) {
      config[E.up].notCanvas = config[E.up].notCanvas || ST.UNFOCUSED;
    }
    if (!config[E.move].any) {
      config[E.move].notCanvas = config[E.move].notCanvas || ST.UNFOCUSED;
    }
    // Or a pointer leaving the element
    config[E.out].any = config[E.out].any || ST.UNFOCUSED;

    return config;
  }

  // Init the possible states of the input state machine
  protected initInputStates(): this {
    this.stateMachine = new StateMachine(this);
    const E = EventNames;

    this.parseStatesConfig({
      [ST.UNFOCUSED]: {
        emitsEvent: true,
        // Handle the mobile tap (touch screens in general)
        [E.down]: {
          onCanvas: ST.TOUCHED,
        },
        [E.over]: {
          onCanvas: ST.FOCUSED,
        },
        [E.move]: {
          onCanvas: ST.FOCUSED,
        },
      },
      [ST.FOCUSED]: this.toUnfocusedConfig({
        emitsEvent: true,
        // After hovering over the object for some time, emit long hover if active
        timeOut: {
          time: this.config.longHoverTime || 0,
          to: ST.LONG_HOV,
        },
        // Touched i.e can be tap or press or drag
        [E.down]: {
          onCanvas: ST.TOUCHED,
        },
        // DESKTOP HACK: take the right mouse button as being a press event
        [E.rightdown]: {
          onCanvas: ST.PRESS,
        },
      }),
      [ST.LONG_HOV]: this.toUnfocusedConfig({
        emitsEvent: true,
        // Check if long hover is enabled
        conditionChecker: longHoverCondition,
        [E.move]: {
          onCanvas: ST.FOCUSED,
        },
        [E.down]: {
          onCanvas: ST.TOUCHED,
          // TODO: HACK to emit tap event when a building popover is on top. maybe change this
          notCanvas: ST.TAP,
        },
        [E.rightdown]: {
          onCanvas: ST.PRESS,
        },
      }),
      [ST.TOUCHED]: this.toUnfocusedConfig({
        emitsEvent: false,
        [E.drag]: {
          onCanvas: ST.DRAG,
        },
        // Before press time it is a tap
        [E.up]: {
          onCanvas: ST.TAP,
        },
        // If press time passes and press is active, go to intermediary state before "up" event
        timeOut: {
          time: this.config.pressTime || 0,
          to: ST.PRESS,
        },
      }),
      // If the mouse moves out of the element, don't go to unfocused
      [ST.DRAG]: {
        emitsEvent: true,
        [E.up]: {
          onCanvas: ST.FOCUSED,
          notCanvas: ST.UNFOCUSED,
        },
      },
      // [ST.PRESSABLE]: this.toUnfocusedConfig({
      //   emitsEvent: false,
      //   // Check if press is enabled
      //   conditionChecker: pressCondition,
      //   [E.up]: {
      //     onCanvas: ST.PRESS,
      //   },
      // }),
      [ST.PRESS]: this.toUnfocusedConfig({
        emitsEvent: true,
        // Check if press is enabled
        conditionChecker: pressCondition,
        [E.up]: {
          onCanvas: ST.FOCUSED,
        },
        // immediate: ST.FOCUSED,
      }),
      // Immediate return to focused
      [ST.TAP]: {
        emitsEvent: true,
        immediate: ST.FOCUSED,
      },
    });

    return this;
  }
}

// Check if the long hover state should be transitioned to
function longHoverCondition(inputComponent: InputComponent, ptr?: Pointer) {
  // Don't emit long hover event on touch enabled devices
  if (!inputComponent.config.longHoverEnabled || SYSTEM.TOUCH_ENABLED) {
    return false;
  }

  return true;
}

function pressCondition(inputComponent: InputComponent, ptr?: Pointer) {
  if (!inputComponent.config.pressEnabled) {
    return false;
  }

  return true;
}
