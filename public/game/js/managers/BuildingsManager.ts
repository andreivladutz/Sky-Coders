import Manager from "./Manager";
import CST from "../CST";
import LoaderInjector, {
  LoadingInjectedManager,
  FramesMap
} from "./LoaderInjector";

export default class BuildingsManager extends Manager
  implements LoadingInjectedManager {
  // the frames of the buildings indexed by their identifier i.e. "residential", etcetera..
  buildingFrames: FramesMap = {};

  // Will be injected by the LoaderInjector class
  loadResources: (load: Phaser.Loader.LoaderPlugin) => void;
  getTextureKey: () => string;

  async preload(load: Phaser.Loader.LoaderPlugin) {
    LoaderInjector.Inject(this, this.buildingFrames, CST.BUILDINGS)(load);
  }

  public static getInstance() {
    return super.getInstance() as BuildingsManager;
  }
}

Manager.subscribeToLoadingPhase(BuildingsManager);
