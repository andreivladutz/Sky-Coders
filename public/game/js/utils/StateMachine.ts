import Phaser from "phaser";
import EventEmitter = Phaser.Events.EventEmitter;

// config of a state
interface StateConfig {
  name: string;
  // additional handlers that can be set
  onEnter?: () => void;
  onExit?: () => void;
  onceOnEnter?: () => void;
}
/**
 * THE ORDER OF THE CALLBACKS ON A TRANSITION:
 * - transitionCb
 * - current state's onExit
 * - next state's onEnter
 * - next state's onceOnEnter
 */
export default class StateMachine<T> extends EventEmitter {
  context: T;
  // the states of this machine
  states: { [K: string]: State<T> } = {};
  // the current state this machine is in
  currState: State<T>;
  /**
   *
   * @param context the context the triggers of these states are running on (the "this")
   */
  constructor(context: T) {
    super();

    this.context = context;
  }

  /**
   * Transitions from the current state to another state. Emits the "transition" event, calling
   * any registered handlers with the following parameters: (fromState, toState, additionalArgs)
   * @param otherStateName the name of the state to transition to
   * @param args any parameters passed along to the transition callback
   */
  transitionTo(otherStateName: string, ...args: any[]): this {
    let otherState = this.states[otherStateName];

    if (!otherState) {
      throw new Error(
        `State machine cannot transition to ${otherStateName} unexisting state`
      );
    }

    if (!this.currState) {
      throw new Error(`State machine cannot transition as it has no states!`);
    }

    this.currState.transitionTo(otherStateName, ...args);
    otherState.enter();

    this.emit("transition", this.currState, otherState, args);

    this.currState = otherState;

    return this;
  }

  // adds a new state to this machine
  addState(config: StateConfig): State<T> {
    let newState = new State<T>(this, config);

    // if this is the first state, then it will also be the current state
    if (!this.currState) {
      this.currState = newState;
      this.currState.enter();
    }

    // push the new state in the states dictionary
    this.states[config.name] = newState;

    return newState;
  }

  // the current state this machine is in
  getCurrState(): State<T> {
    return this.currState;
  }
}

export class State<T> extends EventEmitter {
  parentMachine: StateMachine<T>;
  // the name identifier of this state
  name: string;

  // handlers that can be set on this State
  onExit: () => void;
  onEnter: () => void;

  // call it once on enter then remove it
  onceOnEnter: () => void;

  // the transition callbacks to other states
  transitions: { [K: string]: (...args: any[]) => void } = {};

  constructor(parentMachine: StateMachine<T>, config: StateConfig) {
    super();

    this.parentMachine = parentMachine;
    ({
      name: this.name,
      onExit: this.onExit,
      onEnter: this.onEnter,
      onceOnEnter: this.onceOnEnter,
    } = config);
  }

  /**
   * transition to another state that's in this state's transitions
   * @param otherName the name of the state to transition to
   * @param args any parameters passed along to the transition callback
   */
  transitionTo(otherName: string, ...args: any[]): this {
    if (!this.transitions.hasOwnProperty(otherName)) {
      throw new Error(
        `State ${this.name} cannot transition to ${otherName}. No transition defined`
      );
    }

    let transitionCb = this.transitions[otherName],
      context = this.parentMachine.context;

    if (transitionCb) {
      transitionCb.apply(context, args);
    }

    if (this.onExit) {
      this.onExit.call(context);
    }

    this.emit("exit", this);

    return this;
  }

  /**
   * called by the state machine. entering this state
   */
  enter(): this {
    if (this.onEnter) {
      this.onEnter.call(this.parentMachine.context);
    }

    // call it once and remove it
    if (this.onceOnEnter) {
      this.onceOnEnter.call(this.parentMachine.context);
      this.onceOnEnter = null;
    }

    this.emit("enter", this);

    return this;
  }

  // add a new transition from this state to another state
  addTransition(
    otherState: string,
    transitionCb?: (...args: any[]) => void
  ): this {
    this.transitions[otherState] = transitionCb;

    return this;
  }

  // get the parent machine
  getMachine(): StateMachine<T> {
    return this.parentMachine;
  }
}
