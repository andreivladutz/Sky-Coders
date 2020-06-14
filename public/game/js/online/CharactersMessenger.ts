import SocketManager from "./SocketManager";
import { Characters } from "../../../common/MessageTypes";
import { AsyncLocalStorage } from "async_hooks";

type PositionAckFunc = (pos: Characters.CharaPosition) => void;

export default class CharactersMessenger {
  private socketManager: SocketManager;
  // An array of characters that have to be inited and positioned
  // (This happens when a new client is being created => no previous charas)
  private _positioningAcks: [Characters.DbCharacter, PositionAckFunc][] = [];
  private _existingCharas: Characters.DbCharacter[] = [];

  public get positioningAcks() {
    let acks = this._positioningAcks;
    this._positioningAcks = null;

    return acks;
  }

  public get existingCharas() {
    let charas = this._existingCharas;
    this._existingCharas = null;

    return charas;
  }

  constructor(socketManager: SocketManager) {
    this.socketManager = socketManager;

    this.registerEventListening();
  }

  private registerEventListening() {
    this.socketManager.on(
      Characters.NEW_CHARA_EVENT,
      (newChara: Characters.DbCharacter, ackPosition: PositionAckFunc) => {
        this._positioningAcks.push([newChara, ackPosition]);
      }
    );

    this.socketManager.on(
      Characters.SEND_CHARAS_EVENT,
      (charas: Characters.DbCharacter[]) => {
        this._existingCharas = charas;
      }
    );
  }
}
