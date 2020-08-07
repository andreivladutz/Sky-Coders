/** Add the input handling functions logic to the input component */
import InputComponent, {
  InputComponentCfg,
  EventHandler,
} from "./InputComponent";
import IsoSpriteObject from "../../gameObjects/IsoSpriteObject";
import CST from "../../CST";

export interface HandlersCfg {
  onFocused?: EventHandler;
  onUnfocused?: EventHandler;
  onTap?: EventHandler;
  onPress?: EventHandler;
  onDrag?: EventHandler;
  onLongHover?: EventHandler;
}

export interface InputHandlerCfg extends InputComponentCfg {
  handlers?: HandlersCfg;
}

export default class InputHandlerComponent extends InputComponent
  implements HandlersCfg {
  public constructor(parent: IsoSpriteObject, config: InputHandlerCfg) {
    super(parent, config);

    this.overrideHandlers(config.handlers);

    this.on(CST.INPUT_STATES.FOCUSED, this.onFocused)
      .on(CST.INPUT_STATES.UNFOCUSED, this.onUnfocused)
      .on(CST.INPUT_STATES.TAP, this.onTap)
      .on(CST.INPUT_STATES.PRESS, this.onPress)
      .on(CST.INPUT_STATES.DRAG, this.onDrag)
      .on(CST.INPUT_STATES.LONG_HOV, this.onLongHover);
  }

  // Handler functions to be overriden inside the game objects classes
  public onFocused: EventHandler = () => {};
  public onUnfocused: EventHandler = () => {};
  public onTap: EventHandler = () => {};
  public onPress: EventHandler = () => {};
  public onLongHover: EventHandler = () => {};
  public onDrag: EventHandler = () => {};

  private overrideHandlers(cfg: HandlersCfg) {
    if (!cfg) {
      return;
    }

    for (let [handlerName, handlerFunc] of Object.entries(cfg)) {
      this[handlerName] = handlerFunc;
    }
  }

  // Enable the drag FSM state and enable the scene's dragging input for the parent
  public enableDrag() {
    this.config.dragEnabled = true;
    this.scene.input.setDraggable([this.parentObject]);
  }

  public disableDrag() {
    this.config.dragEnabled = false;
    this.scene.input.setDraggable(this.parentObject, false);
  }

  // Get an input state from the state machine (useful for listening to Exit events or such)
  public getState(stateName: string) {
    return this.stateMachine.states[stateName];
  }

  public onStateMachineEvent(eName: string, handler: Function): this {
    this.stateMachine.on(eName, handler);

    return this;
  }
}
