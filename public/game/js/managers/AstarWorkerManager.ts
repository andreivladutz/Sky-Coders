import Manager from "./Manager";
import MapManager from "./MapManager";

import CST from "../CST";
import { TileXY } from "../IsoPlugin/IsoBoard";

const WK_CST = CST.WORKER;

// TODO: check browser worker compatibility
const Worker = globalThis.Worker;

interface WorkerInitConfig {
  localTileX: number;
  localTileY: number;

  tileWidthX: number;
  tileWidthY: number;

  mapWidth: number;
  mapHeight: number;
  mapGrid: number[][];
  unwalkableTile: number;
}

export default class AstarWorkerManager extends Manager {
  // the workers that handle the astar
  // TODO: each type of actor will have its own worker
  astarWorkers: {
    // the key is the actor key, the value is the worker handling the astar for this object
    [key: string]: any;
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

  getWorker(actorKey: string) {
    return this.astarWorkers[actorKey];
  }

  initWorker(actorKey: string, config: WorkerInitConfig) {
    this.astarWorkers[actorKey] = new Worker(
      "./game/js/utils/astar/astarWebWorker.js"
    );

    // initialize the internal logic of the worker
    // send a config object for the navObjectHelpers
    this.sendMessage(actorKey, WK_CST.MSG.INIT, config);

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
   *
   * @returns {Promise<TileXY[]>} a promise that will be fullfilled as soon as the path is calculated
   *  if no path is found null will be the fullfilled value of the promise
   */
  findPath(
    actorKey: string,
    startTile: TileXY,
    endTile: TileXY
  ): Promise<TileXY[]> {
    let requestId = this.requestId++;

    this.sendMessage(actorKey, WK_CST.MSG.FIND_PATH, {
      startTile,
      endTile,
      requestId
    });

    return new Promise((resolve, reject) => {
      this.pathFindingPromiseResolvers[requestId] = resolve;
    });
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
