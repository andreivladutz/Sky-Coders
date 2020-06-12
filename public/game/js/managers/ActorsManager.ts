import ACTORS_CST, { ACTOR_NAMES_ARR } from "../ACTORS_CST";
import Actor, { ActorConfig } from "../gameObjects/Actor";
import Manager from "./Manager";
import CharacterUI from "../ui/CharacterUI";
import CST from "../CST";
import UIScene from "../scenes/UIScene";
import IsoScene from "../IsoPlugin/IsoScene";

// Singleton class handling the loading of the actor resources
export default class ActorsManager extends Manager {
  // all actors in this scene
  sceneActors: Actor[] = [];
  // currently selected Actor
  selectedActor: Actor = null;
  charaUI: CharacterUI;

  // when an actor gets selected, the actorsManager should be informed
  public onActorSelected(actor: Actor) {
    // there is another actor selected, deselect him
    if (this.selectedActor && this.selectedActor !== actor) {
      this.selectedActor.toggleSelected();
    }

    this.selectedActor = actor;
    this.toggleCharaSelectionUI();
  }

  public onActorDeselected(actor: Actor) {
    if (this.selectedActor === actor) {
      this.toggleCharaSelectionUI();
      this.selectedActor = null;
    }
  }

  // Cancels the movement of all actors
  public cancelAllMovement() {
    for (let actor of this.sceneActors) {
      actor.cancelMovement();
    }
  }

  public static getAllActorsNames() {
    return ACTOR_NAMES_ARR;
  }

  // called in the preload() method of LoadingScene
  // loads all the resources needed for the actors
  async preload(load: Phaser.Loader.LoaderPlugin) {
    this.loadResources(load);
  }

  // Init charaUI internally or init will come from an actor
  public async initCharaUI(actor: Actor) {
    let UIComponents = (await import("../ui/UIComponentsFactory")).default;
    let CharacterUI = (await import("../ui/CharacterUI")).default;

    let gameScene = actor.scene as IsoScene;
    let uiScene = gameScene.scene.get(CST.SCENES.UI) as UIScene;

    // Ignore the ui scene and game scene
    return (this.charaUI = UIComponents.getUIComponents(
      CharacterUI,
      uiScene,
      gameScene
    )[0] as CharacterUI);
  }

  private async toggleCharaSelectionUI() {
    if (!this.charaUI) {
      await this.initCharaUI(this.selectedActor);
    }

    if (this.charaUI.isEnabled) {
      this.charaUI.turnOff();
    } else {
      this.charaUI.enable(this.selectedActor);
    }
  }

  private loadResources(load: Phaser.Loader.LoaderPlugin) {
    // ACTORS_OBJECT is made out of the rest of the keys on ACTORS_CST that are the keys of our ACTORS
    let { resourcePrefix, basePath, ...ACTORS_OBJECT } = ACTORS_CST;

    load.setPrefix(resourcePrefix);
    load.setPath(basePath);

    // load the json multiatlas for each actor
    for (let actorKey in ACTORS_OBJECT) {
      // the object having the multiatlas path and the anims details
      let actorObject = ACTORS_OBJECT[actorKey] as any;

      if (!(typeof actorObject === "object" && "multiatlas" in actorObject)) {
        continue;
      }

      load.multiatlas(actorKey, actorObject.multiatlas);
    }

    // clear the prefix and the path
    load.setPrefix();
    load.setPath();
  }

  public static getInstance(): ActorsManager {
    return super.getInstance() as ActorsManager;
  }
}

Manager.subscribeToLoadingPhase(ActorsManager);
