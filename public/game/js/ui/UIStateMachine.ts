import StateMachine from "../utils/StateMachine";
import BuildPlaceUI from "./BuildPlaceUI";
import MainUI from "./MainUI";
import UIComponents from "./UIComponentsFactory";
import UIScene from "../scenes/UIScene";
import IsoScene from "../IsoPlugin/IsoScene";
import BuildMenuUI from "./BuildMenuUI";
import CST from "../CST";
import BuildingObject from "../gameObjects/BuildingObject";
import ActorsManager from "../managers/ActorsManager";

const STATES = CST.STATES;

// the class describing the ui states and transitions between them
export default class UIStateMachine {
  // the scenes of this game
  uiScene: UIScene;
  gameScene: IsoScene;

  // the internal state machine
  stateMachine: StateMachine<UIStateMachine>;

  // the ui's:

  // main buttons UI
  mainUI: MainUI;
  // the UI placing a building
  buildPlaceUI: BuildPlaceUI;
  // the UI holding the side menu with buildings to place
  buildMenuUI: BuildMenuUI;

  constructor(uiScene: UIScene, gameScene: IsoScene) {
    this.uiScene = uiScene;
    this.gameScene = gameScene;

    // Get all ui components and enable them
    let [mainUI, buildPlaceUI, buildMenuUI] = UIComponents.getUIComponents(
      [MainUI, BuildPlaceUI, BuildMenuUI],
      this.uiScene,
      this.gameScene
    );

    [this.mainUI, this.buildPlaceUI, this.buildMenuUI] = [
      mainUI as MainUI,
      buildPlaceUI as BuildPlaceUI,
      buildMenuUI as BuildMenuUI
    ];

    this.initStates();
  }

  public transitionTo(otherStateName: string, ...args: any[]): this {
    this.stateMachine.transitionTo(otherStateName, ...args);

    return this;
  }

  private initStates() {
    this.stateMachine = new StateMachine<UIStateMachine>(this)
      // the main ui state
      .addState({
        name: STATES.MAIN_UI,
        onceOnEnter: () => {
          this.mainUI.enable();
        }
      })
      // can transition to the build menu
      .addTransition(STATES.BUILD_MENU, () => {
        this.mainUI.turnOff().then(() => this.buildMenuUI.enable());
      })
      .getMachine()
      // the build menu state
      .addState({
        name: STATES.BUILD_MENU
      })
      // if cancel is hit
      .addTransition(STATES.MAIN_UI, () => {
        this.buildMenuUI.turnOff().then(() => this.mainUI.enable());
      })
      // if the user chooses a building to place
      .addTransition(STATES.BUILD_PLACING, (buildingName: string) => {
        // Cancel all actors' movement
        ActorsManager.getInstance().cancelAllMovement();

        // show the Ok button which can be used to place the building
        this.buildMenuUI.showOkButton();
        // enable placing
        this.buildPlaceUI.enable(
          new BuildingObject(this.gameScene, buildingName)
        );
      })
      .getMachine()
      // THE BUILDING PLACEMENT STATE
      .addState({ name: STATES.BUILD_PLACING })
      // hit cancel, go back to the main ui
      .addTransition(STATES.MAIN_UI, () => {
        // remove the building
        this.buildPlaceUI.turnOff(false);
        // same behaviour as goind from build menu to main ui
        this.buildMenuUI.turnOff().then(() => this.mainUI.enable());
        // hide the Ok button
        this.buildMenuUI.hideOkButton();
      })
      // transition to the BUILD_MENU, ONLY if the building is placeable!!
      .addTransition(CST.STATES.BUILD_MENU, () => {
        // place the building, and turn off the movement controls
        this.buildPlaceUI.turnOff(true);
        // hide the Ok button
        this.buildMenuUI.hideOkButton();
      })
      // transition to itself when use chooses another building from the build menu
      // have to change the old building and remove that one
      .addTransition(CST.STATES.BUILD_PLACING, (buildingName: string) => {
        this.buildPlaceUI.chooseAnotherBuilding(
          new BuildingObject(this.gameScene, buildingName)
        );
      })
      .getMachine();
  }
}
