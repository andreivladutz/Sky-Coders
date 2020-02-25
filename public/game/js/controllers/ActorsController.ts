import ACTORS_CST from "../ACTORS_CST";
import Actor, { ActorConfig } from "./Actor";

// Singleton class handling the loading of the actor resources
export default class ActorsController {
  private static instance: ActorsController = null;

  private constructor() {}

  // called in the preload() method of LoadingScene
  // loads all the resources needed for the actors
  loadResources(load: Phaser.Loader.LoaderPlugin) {
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

  public static getInstance() {
    if (ActorsController.instance === null) {
      ActorsController.instance = new ActorsController();
    }

    return ActorsController.instance;
  }
}
