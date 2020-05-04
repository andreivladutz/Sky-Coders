import bodymovinFactory from "./lottie/lottie.min.js";

const bodymovin = bodymovinFactory(window);
const PATH = "/no_auth/screen_anim/",
  BODYMOVIN_DIV = "bm",
  BG_COLOR = "#90a8a6";

const ANIMATIONS = {
  LOGIN_SUCCESS: "loading_successful.json",
  DEFAULT: "loading_screen.json"
};

// Load the default animation and play it on instancing
export default class AnimationHandler {
  constructor() {
    this.container = document.getElementById(BODYMOVIN_DIV);

    this.animation = bodymovin.loadAnimation({
      container: this.container,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: `${PATH}${ANIMATIONS.DEFAULT}`
    });

    this.setBodymovinStyle();
  }

  destroyAnim() {
    this.animation.stop();
    this.animation.destroy();

    if (this.loginSuccessAninm) {
      this.loginSuccessAnim.stop();
      this.loginSuccessAnim.destroy();
    }
  }

  // Remove Mallack and the island
  leaveOnlySkyLayers() {
    let layersCopy = [];
    let layerNamesToRemove = ["malack", "island", "sun/loading_screen"];

    for (let layer of this.animation.animationData.layers) {
      let toDelete = false;

      for (let name of layerNamesToRemove) {
        if (layer.nm.includes(name)) {
          toDelete = true;
          break;
        }
      }

      if (!toDelete) {
        layersCopy.push(layer);
      } else {
        layer.op = 0;
      }
    }

    this.animation.animationData.layers = layersCopy;
  }

  // Optional method to load and play the login success anim
  loadLoginAnim() {
    this.loginSuccessAnim = bodymovin.loadAnimation({
      container: this.container,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: `${PATH}${ANIMATIONS.LOGIN_SUCCESS}`
    });
  }

  playLoginSuccess() {
    if (!this.loginSuccessAnim) {
      this.loadLoginAnim();
    }

    // add a onComplete listener to the login animation
    this.loginSuccessAnim.onComplete = this.onAnimationComplete;

    this.animation.stop();
    this.animation.destroy();
    this.loginSuccessAnim.play();
  }

  // Set some styles so the animation look good in the page
  setBodymovinStyle() {
    let style = this.container.style;

    style.position = "absolute";
    style.top = style.left = 0;
    style.width = style.height = "100%";

    document.body.style.backgroundColor = BG_COLOR;
  }
}
