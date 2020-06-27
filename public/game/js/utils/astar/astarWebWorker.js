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
        // If the Actor uses Blockly, strictPath is desirable as it forces the actor
        // to go exactly to the endTile coords (it is not enough for its grid to touch those coords)
        if (messageData.strictPath) {
          this.findStrictPath(
            messageData.startTile,
            messageData.endTile,
            messageData.requestId
          );
        } else {
          this.findPath(
            messageData.startTile,
            messageData.endTile,
            messageData.requestId
          );
        }
        break;
      // Finding a path to an object is different than finding a path to a single tile
      // There are more available tiles that you can reach
      case WORKER_CST.MSG.FIND_PATH_TO_OBJECT:
        this.findPathToObject(
          messageData.startTile,
          messageData.acceptableTiles,
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
      .setCanWalkOnCb(this.navObject.walkableCallback, this.navObject)
      .setReachedDestinationCb(this.navObject.reachedTileCb, this.navObject);
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
  findPath(startTile, endTiles, requestId) {
    let responseReceived = false;
    let pathFound = false;
    // Accept more endTiles
    endTiles = endTiles instanceof Array ? endTiles : [endTiles];

    let responseCb = path => {
      responseReceived = true;

      // If the path received is null it means the endTile is considered "unwalkable"
      // And the algorithm doesn't even try to calculate a path
      if (path !== null) {
        pathFound = true;
        this.onPathFound(path, requestId);
      }
    };

    for (let endTile of endTiles) {
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

      // If any of the endTiles succeeds stop trying for the rest of the tiles
      if (pathFound) {
        break;
      }
    }

    // if it didn't succeed then probably the end tile cannot be reached
    // (i.e. it searched for too long and didn't find the end of the path)
    if (!responseReceived) {
      this.onPathFound(null, requestId);

      // Return false immediately so we know outside that the navObject didn't succeed
      return false;
    }

    // All end tiles and all configurations tried have failed
    // That means that all endTile are inaccesible (i.e. all callbacks calls are with null as param)
    if (!pathFound) {
      this.onPathFound(null, requestId);

      return false;
    }

    return true;
  }

  // Don't use the reached callback. Walk strictly to endTile
  findStrictPath(startTile, endTile, requestId) {
    this.easystar.setReachedDestinationCb(null, null);

    this.findPath(startTile, endTile, requestId);

    this.easystar.setReachedDestinationCb(
      this.navObject.reachedTileCb,
      this.navObject
    );
  }

  // The acceptable tiles are the tiles around the object that this nav wants to "reach"
  findPathToObject(startTile, acceptableTiles, requestId) {
    this.easystar.setReachedDestinationCb(
      this.navObject.getReachedObjectCb(acceptableTiles),
      this.navObject
    );

    this.findPath(startTile, acceptableTiles, requestId);

    this.easystar.setReachedDestinationCb(
      this.navObject.reachedTileCb,
      this.navObject
    );
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
