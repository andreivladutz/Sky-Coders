import Manager from "./Manager";
import CST from "../CST";

export default class BuildingsManager extends Manager {
  // the frames of the buildings indexed by their identifier i.e. "residential", etcetera..
  buildingFrames: {
    [key: string]: string;
  } = {};

  getTextureKey() {
    return CST.BUILDINGS.ATLAS_KEY;
  }

  public generateFrames() {
    let framesPrefix = CST.BUILDINGS.PREFIX;

    // take all building types ids
    for (let buildingId of Object.values(CST.BUILDINGS.TYPES)) {
      this.buildingFrames[buildingId] = framesPrefix.concat(buildingId);
    }
  }

  async preload(load: Phaser.Loader.LoaderPlugin) {
    this.loadResources(load);

    this.generateFrames();
  }

  private loadResources(load: Phaser.Loader.LoaderPlugin) {
    const { BUILDINGS: BLDS } = CST;

    load.setPath(BLDS.MULTIATLAS_PATH);

    // load MULTIATLAS with ATLAS_KEY resource's identifier
    load.multiatlas(BLDS.ATLAS_KEY, BLDS.MULTIATLAS);

    // clear the path and prefix afterwards
    load.setPath();
  }

  public static getInstance() {
    return super.getInstance() as BuildingsManager;
  }
}

Manager.subscribeToLoadingPhase(BuildingsManager);
