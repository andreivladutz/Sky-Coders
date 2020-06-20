import Manager from "./Manager";

import CST from "../CST";
import { TileXY } from "../map/IsoBoard";

const WK_CST = CST.WORKER;

// TODO: check browser worker compatibility

interface WorkerMapConfig {
  mapWidth: number;
  mapHeight: number;
  mapGrid: number[][];
  unwalkableTile: number;
}

interface WorkerActorConfig {
  localTileX: number;
  localTileY: number;

  tileWidthX: number;
  tileWidthY: number;
}
export default class AstarWorkerManager extends Manager {
  // the workers that handle the astar
  // TODO: each type of actor will have its own worker
  astarWorkers: {
    // the key is the actor key, the value is the worker handling the astar for this object
    [key: string]: Worker;
  } = {};

  // whether the workers have been inited by the actors with their particular details
  workersActorInited: {
    [key: string]: boolean;
  } = {};

  // for any path finding request a promise is created
  // this object indexes those promises' resolve functions by requestId
  pathFindingPromiseResolvers: {
    [key: number]: (value: any) => void;
  } = {};

  requestId: number = 0;

  protected constructor() {
    super();
  }

  // global initialisation of all the workers for each type of actor
  // it inits the map for the helper objects of the workers
  initWorkersWithMap(actorKeys: string[], mapConfig: WorkerMapConfig) {
    for (let actorKey of actorKeys) {
      this.astarWorkers[actorKey] = new Worker(
        "./game/js/utils/astar/astarWebWorker.js"
      );

      this.workersActorInited[actorKey] = false;
      this.sendMessage(actorKey, WK_CST.MSG.INIT_MAP, mapConfig);
    }
  }

  getWorker(actorKey: string) {
    return this.astarWorkers[actorKey];
  }

  isWorkerActorInited(actorKey: string) {
    return this.workersActorInited[actorKey];
  }

  // initialisation done by each actor
  initWorkerWithActor(actorKey: string, config: WorkerActorConfig) {
    // initialize the internal logic of the worker
    // send a config object for the navObjectHelpers
    this.sendMessage(actorKey, WK_CST.MSG.INIT_ACTOR, config);

    this.astarWorkers[actorKey].onmessage = e => {
      this.handleMessage(e.data);
    };

    // save the worker now that it is inited
    return this.astarWorkers[actorKey];
  }

  /**
   *
   * @param actorKey the unique key of this type of object
   * @param startTile the starting point of the path
   * @param endTile the ending point of the path
   * @param strictPath should go strictly to endTile or being near it is ok
   *
   * @returns {Promise<TileXY[]>} a promise that will be fullfilled as soon as the path is calculated
   *  if no path is found null will be the fullfilled value of the promise
   */
  findPath(
    actorKey: string,
    startTile: TileXY,
    endTile: TileXY,
    strictPath: boolean
  ): Promise<TileXY[]> {
    let requestId = this.requestId++;

    this.sendMessage(actorKey, WK_CST.MSG.FIND_PATH, {
      startTile,
      endTile,
      requestId,
      strictPath
    });

    return new Promise((resolve, reject) => {
      this.pathFindingPromiseResolvers[requestId] = resolve;
    });
  }

  /**
   * Find a path to an object instead of a tile
   * @param actorKey the unique key of this type of object
   * @param startTile the starting point of the path
   * @param acceptableTiles the row of tiles around the object
   *
   * @returns {Promise<TileXY[]>} a promise that will be fullfilled as soon as the path is calculated
   *  if no path is found null will be the fullfilled value of the promise
   */
  findPathToObject(
    actorKey: string,
    startTile: TileXY,
    acceptableTiles: TileXY[]
  ): Promise<TileXY[]> {
    let requestId = this.requestId++;

    this.sendMessage(actorKey, WK_CST.MSG.FIND_PATH_TO_OBJECT, {
      startTile,
      acceptableTiles,
      requestId
    });

    return new Promise((resolve, reject) => {
      this.pathFindingPromiseResolvers[requestId] = resolve;
    });
  }

  // all workers should apply this layer
  applyLayer(layer: TileXY[]) {
    for (let actorKey in this.astarWorkers) {
      this.sendMessage(actorKey, WK_CST.MSG.APPLY_LAYER, layer);
    }
  }

  // all workers should apply this layer
  removeLayer(layer: TileXY[]) {
    for (let actorKey in this.astarWorkers) {
      this.sendMessage(actorKey, WK_CST.MSG.REMOVE_LAYER, layer);
    }
  }

  resolveFoundPath(path: TileXY[], requestId: number) {
    // Resolve the promise returned from the findPath method with the path returned from the worker
    this.pathFindingPromiseResolvers[requestId](path);

    delete this.pathFindingPromiseResolvers[requestId];
  }

  /**
   *  send a message to the worker
   *  @param actorKey is the key used to hash the worker for this type of object
   *  @param messageType is a constant telling which type of message is being sent
   *  @param data is the actual data of the message being sent
   */
  private sendMessage(actorKey: string, messageType: number, data: any) {
    this.astarWorkers[actorKey].postMessage({
      // the type of the message
      [WK_CST.MESSAGE_TYPE]: messageType,
      // the data that comes with the message
      [WK_CST.DATA]: data
    });
  }

  /**
   * Handles a message received from a worker
   * @param message the event's data property from the messageEvent
   */
  private handleMessage(message: any) {
    let messageData = message[WK_CST.DATA];

    // every message has a "header" that tells the type of the message
    switch (message[WK_CST.MESSAGE_TYPE]) {
      // initialisation process
      case WK_CST.MSG.PATH_FOUND:
        this.resolveFoundPath(messageData.path, messageData.requestId);
        break;
      default:
        throw new Error("MESSAGE TYPE NOT RECOGNISED BY THIS WEB WORKER.");
    }
  }

  public static getInstance(): AstarWorkerManager {
    return super.getInstance() as AstarWorkerManager;
  }
}
