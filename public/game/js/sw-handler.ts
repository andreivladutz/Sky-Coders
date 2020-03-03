import CST from "./CST";

// service worker registering and specific logic
export default class SWHandler {
  // check if the service worker is available
  public static register(): Function {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        // register the service worker built by webpack
        navigator.serviceWorker.register(CST.SW.BUILT_SW_PATH);
      });
    }

    return SWHandler;
  }
}
