import { Scene } from "phaser";
import IsoPlugin, { IsoSpriteBuilder, IsoPhysics } from "./IsoPlugin";

// the IsoPlugin will be accesed on the scene via this.iso
const ISO_SCENE_KEY = "iso";
const ISO_PHYSICS_SCENE_KEY = "isoPhysics";

// tell typescript that the isometric plugin is going to inject the isoSprite property on the GameObjectFactory
interface GameObjectFactoryIso extends Phaser.GameObjects.GameObjectFactory {
  isoSprite?: IsoSpriteBuilder;
}

export default class IsoScene extends Scene {
  // the add factory has an "isoSprite" IsoSpriteBuilder method
  add: GameObjectFactoryIso;
  // these properties will be changed by injecting the isometric plugin
  iso: IsoPlugin;
  // if physics are enabled, this will be the injected property on the scene
  isoPhysics?: IsoPhysics;
  // the projection angle
  isometricType?: number;

  // are physics enabled?
  private physicsEnabled: boolean;

  /**
   *
   * @param config Scene specific configuration settings. A string is not accepted for this scene
   * @param physicsEnabled Should isoPhysics also be injected on the scene? Defaults to false
   */
  constructor(
    config: Phaser.Types.Scenes.SettingsConfig,
    physicsEnabled: boolean = false
  ) {
    if (!config.mapAdd) {
      config.mapAdd = {};
    }
    // inject the "iso" key on the scene
    config.mapAdd.isoPlugin = ISO_SCENE_KEY;

    if (physicsEnabled) {
      config.mapAdd.isoPhysics = ISO_PHYSICS_SCENE_KEY;
    }

    super(config);

    this.physicsEnabled = physicsEnabled;
  }

  /**
   * @param {string} isoPluginUniqueId A unique key used to identify the IsoPlugin in the loader
   * @param {string} physicsPluginUniqueId A unique key used to identify the IsoPhysics in the loader
   * If parameters are not provided, uuids will be generated
   */
  preload(
    isoPluginUniqueId: string = Phaser.Math.RND.uuid(),
    physicsPluginUniqueId: string = Phaser.Math.RND.uuid()
  ) {
    // load the isometric plugin
    this.load.scenePlugin({
      key: isoPluginUniqueId,
      url: IsoPlugin,
      // the key used to refer the IsoPlugin is "iso"
      sceneKey: ISO_SCENE_KEY
    });

    // also load the physics plugin if physics are enabled
    if (this.physicsEnabled) {
      this.load.scenePlugin({
        key: physicsPluginUniqueId,
        url: IsoPhysics,
        sceneKey: ISO_PHYSICS_SCENE_KEY
      });
    }
  }
}
