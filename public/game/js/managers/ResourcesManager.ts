import Manager from "./Manager";
import { Resources } from "../../../common/BuildingTypes";
import ResourcesUI from "../ui/ResourcesUI";
import UIComponents from "../ui/UIComponentsFactory";
import IsoScene from "../IsoPlugin/IsoScene";
import CST from "../CST";
import UIScene from "../scenes/UIScene";
import MainUI from "../ui/MainUI";
import GameManager from "../online/GameManager";

export default class ResourcesManager extends Manager {
  public currentResources: Resources;
  // The resources messenger that talks to the server
  public resourcesMessenger = GameManager.getInstance().messengers.resources;

  public resourcesUi: ResourcesUI;
  public mainUi: MainUI;

  public initResourcesUi(gameScene: IsoScene) {
    [this.resourcesUi, this.mainUi] = UIComponents.getUIComponents(
      [ResourcesUI, MainUI],
      gameScene.scene.get(CST.SCENES.UI) as UIScene,
      gameScene
    ) as [ResourcesUI, MainUI];

    // Pass the mainUi to the resourcesUi
    this.resourcesUi.enable(this.mainUi);
    this.currentResources = this.resourcesMessenger.initialResources;
    // Update the mainUi with the resources received from the server on game init
    this.mainUi.resources.updateCoinsValue(this.currentResources.coins);
  }

  public resetResources() {
    this.setResources(this.currentResources);
  }

  // Updates coming from the server => resourcesAfterPlacement or resourcesAfterCollect
  public setResources(resources: Resources) {
    this.setCoins(resources.coins);
  }

  // TODO: Change to account for all resources. Also move to Common with server
  /**
   * Compute the resources client-side for speed, but the server has the last word
   *
   * Also, if spend is true, it returns false if there are insufficient funds and true otherwise
   *
   * @param resources the spent / collected resources
   * @param spend if @true the resources are spent. If @false the resources are collected
   */
  public spendCollectResourcesClientSide(
    resources: Resources,
    spend: boolean = true
  ): boolean {
    if (spend) {
      // Insufficient funds
      if (this.currentResources.coins - resources.coins < 0) {
        return false;
      } else {
        this.currentResources.coins -= resources.coins;

        return true;
      }
    }

    this.currentResources.coins += resources.coins;
    // if spend is false i.e. collect return true all the time
    return true;
  }

  private setCoins(coins: number) {
    this.currentResources.coins = coins;
    this.mainUi.resources.updateCoinsValue(coins);
  }

  public static getInstance(): ResourcesManager {
    return super.getInstance() as ResourcesManager;
  }
}
