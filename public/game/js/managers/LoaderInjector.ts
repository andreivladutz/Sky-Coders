import Manager from "./Manager";
import { MultiatlasConfig } from "../CST";

type LoaderFunction = (load: Phaser.Loader.LoaderPlugin) => void;
type InjectedManager = Manager & LoadingInjectedManager;

export interface LoadingInjectedManager {
  loadResources: LoaderFunction;
  getTextureKey: () => string;
}

// A mapping of the frames names, indexed by the constant resource identifiers
export type FramesMap = {
  [key: string]: string;
};

/**
 * Handles loading phase for the Managers that have multiatlas textures
 * and a certain type of config
 *
 * The injector "injects" functions on the Managers calling the inject methods on themselves
 */
export default class LoaderInjector {
  /**
   * Inject the @getTextureKey method, the @loadResources method and generates and stores
   * the frames on the @framesMap according to the @config object
   * @param manager
   * @param framesMap
   * @param config
   */
  public static Inject(
    manager: InjectedManager,
    framesMap: FramesMap,
    config: MultiatlasConfig
  ): LoaderFunction {
    return this.InjectGetTextureFunc(manager, config)
      .GenerateFrames(framesMap, config)
      .InjectLoader(manager, config);
  }

  /**
   *
   * @param manager the manager (implementing  the {LoadingInjectedManager} interface) to be injected
   * @param config
   *
   * @returns the loadResources function
   */
  public static InjectLoader(
    manager: InjectedManager,
    config: MultiatlasConfig
  ): LoaderFunction {
    return (manager.loadResources = (load: Phaser.Loader.LoaderPlugin) => {
      load.setPath(config.MULTIATLAS_PATH);

      // load MULTIATLAS with ATLAS_KEY resource's identifier
      load.multiatlas(config.ATLAS_KEY, config.MULTIATLAS);

      // clear the path and prefix afterwards
      load.setPath();
    });
  }

  /**
   * inject the getTextureKey method on the provided manager object
   * @param manager the manager to be injected
   * @param config the config of the multiatlas where the texture's key will be taken from
   */
  public static InjectGetTextureFunc(
    manager: InjectedManager,
    config: MultiatlasConfig
  ): typeof LoaderInjector {
    manager.getTextureKey = () => {
      return config.ATLAS_KEY;
    };

    return this;
  }

  /**
   * generates frames and puts them on the framesMap object
   * @param framesMap the object that will hold the generated frames names
   * @param config the config used to generate the frames names
   */
  public static GenerateFrames(
    framesMap: FramesMap,
    config: MultiatlasConfig
  ): typeof LoaderInjector {
    if (typeof framesMap !== "object") {
      throw new Error("The framesMap should be an initialised object!");
    }

    let framesPrefix = config.PREFIX;

    // take all building types ids
    for (let buildingId of Object.values(config.TYPES)) {
      framesMap[buildingId] = framesPrefix.concat(buildingId);
    }

    return this;
  }
}
