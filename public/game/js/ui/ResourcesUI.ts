import UIComponent from "./uiUtils/UIComponent";
import IsoScene from "../IsoPlugin/IsoScene";
import UIScene from "../scenes/UIScene";
import BuildingObject from "../gameObjects/BuildingObject";
import { CubeIndices } from "../IsoPlugin/Cube";
import CST from "../CST";
import SVGObject from "./uiObjects/SVGObject";
import EnvironmentManager from "../managers/EnvironmentManager";

import Group = Phaser.GameObjects.Group;
import Tween = Phaser.Tweens.Tween;

const COINS = CST.UI.COINS;
interface SVGCoin extends SVGObject {
  building?: BuildingObject;
  animationTween?: Tween;
}

export default class ResourcesUI extends UIComponent {
  public readonly coinSize = EnvironmentManager.getInstance().TILE_WIDTH;
  public coins: Group;

  constructor(uiScene: UIScene, gameScene: IsoScene) {
    super(uiScene, gameScene);

    this.coins = new Group(gameScene);

    this.gameScene.scale.on("resize", this.repositionCoins, this);
  }

  public enable() {}

  public turnOff() {}

  // Show coins or produced resources icon above a building
  public showProductionReady(building: BuildingObject) {
    // Center the coin on top of the building
    let coin = new SVGObject(
      this.gameScene,
      0,
      0,
      `${COINS.PREFIX}${COINS.TYPES.PURPLE.KEY}`
    )
      .setWidth(this.coinSize)
      .setOrigin(0, 0)
      .setDepth(CST.LAYER_DEPTH.UI)
      .setAlpha(0.9) as SVGCoin;

    coin.building = building;

    this.coins.add(coin);
    this.repositionCoin(coin);
  }

  private repositionCoins() {
    this.coins.children.each((coin: SVGCoin) => this.repositionCoin(coin));
  }

  private repositionCoin(coin: SVGCoin) {
    let proj = this.gameScene.iso.projector;

    // Get the coordinates of the bounding cube's top face
    let boundCorners = coin.building.bounds3D.getCorners();
    let leftFrontCorner = proj.project(
      boundCorners[CubeIndices.TOP_LEFT_FRONT]
    );
    let rightBackCorner = proj.project(
      boundCorners[CubeIndices.TOP_RIGHT_BACK]
    );
    let leftBackCorner = proj.project(boundCorners[CubeIndices.TOP_LEFT_BACK]);
    let rightFrontCorner = proj.project(
      boundCorners[CubeIndices.TOP_RIGHT_FRONT]
    );

    if (coin.animationTween) {
      coin.animationTween.remove();
    }

    coin.x = (leftFrontCorner.x + rightBackCorner.x - this.coinSize) / 2;
    coin.y = (leftBackCorner.y + rightFrontCorner.y - this.coinSize * 3) / 2;

    // The y of the coin when it is idle
    let idleY = coin.y;

    // Add a bouncing animation to the coin
    coin.animationTween = this.gameScene.add.tween({
      targets: coin,
      y: {
        value: {
          getStart: () => {
            return idleY - COINS.BOUNCE_DELTAY;
          },
          getEnd: () => {
            return idleY;
          }
        }
      },
      ease: "Linear",
      duration: COINS.BOUNCE_TIME,
      repeat: -1,
      yoyo: true
    });
  }
}
