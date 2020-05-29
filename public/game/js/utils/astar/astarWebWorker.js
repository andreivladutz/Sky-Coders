importScripts(
  "./node.js",
  "./heap.js",
  "./easystar.js",
  "./navObjectHelpers.js",
  "./WORKER_CST.js"
);

let Worker = new (class AstarWorker {
  constructor() {
    self.onmessage = e => {
      this.handleMessage(e.data);
    };
  }

  handleMessage(message) {
    let messageData = message[WORKER_CST.DATA];

    // every message has a "header" that tells the type of the message
    switch (message[WORKER_CST.MESSAGE_TYPE]) {
      // initialisation process
      case WORKER_CST.MSG.INIT_MAP:
        // first, init the map
        this.initMap(messageData);
        break;
      case WORKER_CST.MSG.INIT_ACTOR:
        this.initActor(messageData);
        break;
      case WORKER_CST.MSG.FIND_PATH:
        this.findPath(
          messageData.startTile,
          messageData.endTile,
          messageData.requestId
        );
        break;
      case WORKER_CST.MSG.APPLY_LAYER:
        this.applyLayer(messageData);
        break;
      case WORKER_CST.MSG.REMOVE_LAYER:
        this.removeLayer(messageData);
        break;
      default:
        throw new Error("MESSAGE TYPE NOT RECOGNISED BY THIS WEB WORKER.");
    }
  }

  initMap(config) {
    // init the helper and the easystar instance
    this.navObject = new NavObjectHelpers(config);

    this.easystar = new EasyStar.js();

    this.easystar
      .setGrid(config.mapGrid)
      .setUnacceptableTiles([config.unwalkableTile])
      .enableDiagonals()
      .enableSync()
      .setIterationsPerCalculation(WORKER_CST.ITERATIONS_PER_CALCULATION)
      // the callback used to determine if the object can walk on a tile or not
      .setCanWalkOnCb(this.navObject.walkableCallback, this.navObject);
  }

  initActor(actorConfig) {
    // init the helper with actor details
    this.navObject.configureActor(actorConfig);
  }

  // just apply the layer to the nav object's object grid
  applyLayer(tiles) {
    this.navObject.applyLayer(tiles);
  }

  // remove the layer from the nav object's object grid
  removeLayer(tiles) {
    this.navObject.removeLayer(tiles);
  }

  // each path finding instance has a request id where it came from
  // and each instance has an instance id which can be used to cancel the path finding process
  findPath(startTile, endTile, requestId) {
    let responseReceived = false;

    let responseCb = path => {
      responseReceived = true;

      this.onPathFound(path, requestId);
    };

    let instanceId = this.easystar.findPath(
      startTile.x,
      startTile.y,
      endTile.x,
      endTile.y,
      responseCb
    );

    // try to compute the path
    this.easystar.calculate();
    // whether it succedeed or not, cancel the path finding
    this.easystar.cancelPath(instanceId);

    // if it didn't succeed then probably the end tile cannot be reached
    if (!responseReceived) {
      this.onPathFound(null, requestId);
    }
  }

  onPathFound(path, requestId) {
    // if a path has been found
    if (path !== null) {
      path = this.navObject.smoothPath(path);
    }

    this.sendMessage(WORKER_CST.MSG.PATH_FOUND, {
      path,
      requestId
    });
  }

  /**
   *  send a message to the main thread
   *  @param messageType is a constant telling which type of message is being sent
   *  @param data is the actual data of the message being sent
   */
  sendMessage(messageType, data) {
    self.postMessage({
      // the type of the message
      [WORKER_CST.MESSAGE_TYPE]: messageType,
      // the data that comes with the message
      [WORKER_CST.DATA]: data
    });
  }
})();
