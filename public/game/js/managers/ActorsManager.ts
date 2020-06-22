import ACTORS_CST, { ACTOR_NAMES_ARR, ACTOR_NAMES } from "../ACTORS_CST";
import Actor, { ActorConfig } from "../gameObjects/Actor";
import Manager from "./Manager";
import CharacterUI from "../ui/CharacterUI";
import CST from "../CST";
import UIScene from "../scenes/UIScene";
import IsoScene from "../IsoPlugin/IsoScene";
import GameManager from "../online/GameManager";
import LayersManager from "./LayersManager";
import MapManager from "./MapManager";
import BlocklyManager from "../Blockly/BlocklyManager";

// Singleton class handling the loading of the actor resources
export default class ActorsManager extends Manager {
  // all actors in this scene
  public sceneActors: Actor[] = [];
  // currently selected Actor
  public selectedActor: Actor = null;
  public charaUI: CharacterUI;
  // The messenger used to talk to the server "about" the game charas
  public charaMsgr = GameManager.getInstance().messengers.characters;

  // Init all characters coming from the server (all positioned)
  // And position the characters that have to be positioned
  public initCharacters(gameScene: IsoScene): this {
    // Ack functions that take in the position of the new actor
    for (let [characterInfo, positionAck] of this.charaMsgr.positioningAcks) {
      let actor = new Actor({
        tileX: 0,
        tileY: 0,
        scene: gameScene,
        actorKey: characterInfo.actorKey,
        dbId: characterInfo._id,
        blocklyWorkspace: characterInfo.workspaceBlockly
      });

      this.placeActor(actor, this.sceneActors);
      positionAck({ x: actor.tileX, y: actor.tileY });
    }

    for (let existingActor of this.charaMsgr.existingCharas) {
      new Actor({
        scene: gameScene,
        actorKey: existingActor.actorKey,
        tileX: existingActor.position.x,
        tileY: existingActor.position.y,
        dbId: existingActor._id,
        blocklyWorkspace: existingActor.workspaceBlockly
      });
    }

    // After all characters have been inited, init the blockly manager
    BlocklyManager.getInstance().init(gameScene.cache);

    return this;
  }

  // Place an actor on the INITED map
  private placeActor(actor: Actor, actorsArray: Actor[]) {
    // TODO: in the future let the user place the actors manually
    // do not risk not finding a good positioning
    let foundPosition: boolean;
    let layerManager = LayersManager.getInstance();
    let mapManager = MapManager.getInstance();

    let RND = Phaser.Math.RND;

    do {
      foundPosition = true;

      let tileX = RND.integerInRange(0, mapManager.mapWidth - 1);
      let tileY = RND.integerInRange(0, mapManager.mapHeight - 1);

      actor.setTilePosition(tileX, tileY);

      if (layerManager.isColliding(actor, true)) {
        foundPosition = false;
      }
    } while (!foundPosition);
  }

  // Send updates to the server about the actor
  public sendActorUpdates(actor: Actor, dbId: string) {
    this.charaMsgr.updateCharacter({
      actorKey: actor.actorKey as ACTOR_NAMES,
      _id: dbId,
      position: {
        x: actor.tileX,
        y: actor.tileY
      },
      workspaceBlockly: actor.codeHandler.blocklyWorkspace
    });
  }

  // when an actor gets selected, the actorsManager should be informed
  public onActorSelected(actor: Actor) {
    // there is another actor selected, deselect him
    if (this.selectedActor && this.selectedActor !== actor) {
      this.selectedActor.deselect();
    }

    this.selectedActor = actor;
    this.toggleCharaSelectionUI(true);
  }

  public onActorDeselected() {
    this.toggleCharaSelectionUI(false);
    this.selectedActor = null;
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

  // Turn on or off the chara selection UI
  private async toggleCharaSelectionUI(turnOn: boolean) {
    if (!this.charaUI) {
      // The character is only needed to get the game and the ui scenes
      await this.initCharaUI(this.selectedActor);
    }

    if (turnOn) {
      if (this.charaUI.isEnabled) {
        this.charaUI.turnOff();
        this.charaUI.enable(this.selectedActor);
      } else {
        this.charaUI.enable(this.selectedActor);
      }
    } else {
      this.charaUI.turnOff();
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
