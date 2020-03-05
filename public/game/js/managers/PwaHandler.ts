import CST from "../CST";
import { Workbox } from "workbox-window";

interface InstallEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: string }>;
}

// service worker registering and specific logic
export default class PwaHandler {
  private constructor() {}

  // workbox handler for window
  private static workbox: Workbox = null;

  private static deferredInstallPrompt: InstallEvent = null;
  // function to call when beforeinstallprompt is fired, to let the user know the app can be installed
  private static installEventCb = (event: InstallEvent) => {
    /* default NO-OP */
  };

  // if the app installs through other methods or our deferred prompt we should know
  // also if the user refused the installation, we shouldn't bother him anymore
  private static alreadyInstalledOrCancelled: boolean = false;

  private static refusedInstallPrompt: boolean = false;
  private static acceptedInstallPrompt: boolean = false;

  public static init(): typeof PwaHandler {
    return this.registerSW().registerInstallEvent();
  }

  public static wasInstallRefused(): boolean {
    return this.refusedInstallPrompt;
  }

  public static wasInstallAccepted(): boolean {
    return this.acceptedInstallPrompt;
  }

  // add handler callback to prompt the user to install
  // the callback should have a parameter which will be the deferredInstallPrompt event
  public static setPromptHandler(
    cb: (e: InstallEvent) => void
  ): typeof PwaHandler {
    if (this.alreadyInstalledOrCancelled) {
      return this;
    }

    // event already fired, call the handler right away
    if (this.deferredInstallPrompt !== null) {
      cb(this.deferredInstallPrompt);
    } else {
      // otherwise it will be called later
      this.installEventCb = cb;
    }

    return this;
  }

  // listen for the beforeinstallprompt event and save the event for later processing
  public static registerInstallEvent(): typeof PwaHandler {
    window.addEventListener("appinstalled", () => {
      this.alreadyInstalledOrCancelled = true;
    });

    window.addEventListener("beforeinstallprompt", (e: InstallEvent) => {
      PwaHandler.deferredInstallPrompt = e;

      // we should know if the user accepted or declined the install prompt
      e.userChoice
        .then(choice => {
          if (choice.outcome === "accepted") {
            this.acceptedInstallPrompt = true;
          } else {
            this.refusedInstallPrompt = true;
          }
        })
        .finally(() => {
          this.alreadyInstalledOrCancelled = true;
        });

      this.installEventCb(e);
    });

    return PwaHandler;
  }

  // check if the service worker is available
  public static registerSW(): typeof PwaHandler {
    if ("serviceWorker" in navigator) {
      this.workbox = new Workbox(CST.SW.BUILT_SW_PATH);
      this.listenForNewSW();

      // register the service worker built by webpack
      this.workbox.register();
    }

    return PwaHandler;
  }
  /*
    source: https://developers.google.com/web/tools/workbox/guides/advanced-recipes
  */
  public static listenForNewSW(): typeof PwaHandler {
    // Add an event listener to detect when the registered
    // service worker has installed but is waiting to activate.
    this.workbox.addEventListener("waiting", event => {
      console.log("The SW is waiting");
      // `event.wasWaitingBeforeRegister` will be false if this is
      // the first time the updated service worker is waiting.
      // When `event.wasWaitingBeforeRegister` is true, a previously
      // updated same service worker is still waiting.
      // You may want to customize the UI prompt accordingly.

      // TODO: Replace confirm with a customized pop-up
      if (
        confirm(
          "An updated service worker is waiting to be activated. Press ok to reload."
        )
      ) {
        // Assuming the user accepted the update, set up a listener
        // that will reload the page as soon as the previously waiting
        // service worker has taken control.
        this.workbox.addEventListener("controlling", event => {
          window.location.reload();
        });

        // Send a message telling the service worker to skip waiting.
        // This will trigger the `controlling` event handler above.
        // Note: for this to work, you have to add a message
        // listener in your service worker. See below.
        this.workbox.messageSW({ type: "SKIP_WAITING" });
      }
    });

    return PwaHandler;
  }
}
