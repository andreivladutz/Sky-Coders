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
import Rectangle = Phaser.Geom.Rectangle;
import MainUI from "./MainUI";
import CameraManager from "../managers/CameraManager";

const COINS = CST.UI.COINS;
export interface SVGCoin extends SVGObject {
  building?: BuildingObject;
  animationTween?: Tween;
}

export default class ResourcesUI extends UIComponent {
  public readonly coinSize = EnvironmentManager.getInstance().TILE_WIDTH;
  public coins: Group;
  // A Rectangle reused as bounds for each coin
  private coinBounds = new Rectangle();
  private mainUi: MainUI;

  constructor(uiScene: UIScene, gameScene: IsoScene) {
    super(uiScene, gameScene);

    this.coins = new Group(gameScene);

    this.gameScene.scale.on("resize", this.repositionCoins, this);
    // Check if the game coins are visible (i.e. not hidden behind the ui on the uiScene)
    this.gameScene.events.on("update", this.checkCoinsVisible, this);
  }

  public enable(mainUi: MainUI) {
    this.mainUi = mainUi;
  }

  public turnOff() {}

  // Hide the coin that's showing above the building
  public hideProductionReady(coin: SVGCoin) {
    if (!coin) {
      return;
    }

    if (coin.animationTween) {
      coin.animationTween.remove();
    }

    // Animate the coin going up and out of the screen
    coin.animationTween = this.gameScene.add.tween({
      targets: coin,
      y: CameraManager.getInstance().camera.worldView.y - this.coinSize,
      ease: "Linear",
      duration: COINS.COLLECT_ANIM_TIME
    });

    coin.animationTween.on("complete", () => {
      coin.animationTween.remove();
      coin.animationTween = null;

      this.coins.killAndHide(coin);
    });
  }

  // Show coins or produced resources icon above a building
  public showProductionReady(building: BuildingObject) {
    let coin = this.getUnusedCoin();

    coin.building = building;
    building.productionCoin = coin;

    this.repositionCoin(coin);
  }

  // Hide the coins when they are over the ui buttons and bottom bar
  private checkCoinsVisible() {
    const TX = 4,
      TY = 5;
    this.coins.children.each((coin: SVGCoin) => {
      if (!coin.active) {
        return;
      }

      // Get the transform matrix
      let transform = getComputedStyle(coin.node).getPropertyValue("transform");

      if (!transform) {
        return;
      }

      let splitMatrix = transform.split(",");

      this.coinBounds.x = parseFloat(splitMatrix[TX]);
      this.coinBounds.y = parseFloat(splitMatrix[TY]);

      this.coinBounds.width = this.coinBounds.height =
        this.coinSize * CameraManager.getInstance().camera.zoom;

      let mainBtns = this.mainUi.mainButtons;
      let coinIsVisible = true;

      if (Rectangle.Overlaps(this.coinBounds, mainBtns.bottomBarBounds)) {
        coinIsVisible = false;
      }

      if (Rectangle.Overlaps(this.coinBounds, mainBtns.mainButtonsBounds)) {
        coinIsVisible = false;
      }

      coin.setVisible(coinIsVisible);
    });
  }

  // Get an unused coin or create a new one
  private getUnusedCoin(): SVGCoin {
    let coin = this.coins.getFirstDead();

    if (coin) {
      return coin.setActive(true).setVisible(true);
    }

    coin = new SVGObject(
      this.gameScene,
      0,
      0,
      `${COINS.PREFIX}${COINS.TYPES.PURPLE.KEY}`
    )
      .setWidth(this.coinSize)
      .setOrigin(0, 0)
      .setDepth(CST.LAYER_DEPTH.UI)
      .setAlpha(0.9) as SVGCoin;

    this.coins.add(coin);

    return coin;
  }

  // Reposition the active coins on screen resize
  private repositionCoins() {
    this.coins.children.each(
      (coin: SVGCoin) => coin.active && this.repositionCoin(coin)
    );
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
