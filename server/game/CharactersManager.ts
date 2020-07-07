import GameObjectsManager from "./gameUtils/GameObjectsManager";
import GameInstance from "./GameInstance";

import { Characters } from "../../public/common/MessageTypes";
import { ACTOR_NAMES } from "../../public/common/CharacterTypes";
import CST from "../../public/common/CommonCST";

import mongoose from "mongoose";
import DocumentArray = mongoose.Types.DocumentArray;
import { CharacterType } from "../models/Island";

// Handle the game characters for a user
export default class CharactersManager extends GameObjectsManager {
  constructor(gameInstance: GameInstance) {
    super(gameInstance);

    this.listenForEvents();
  }

  // Get the initial characters from the db that are sent to the client
  public sendCharacters() {
    if (!this.islandDoc.characters || !this.islandDoc.characters.length) {
      this.islandDoc.characters = [] as DocumentArray<CharacterType>;

      for (let i = 0; i < CST.CHARACTERS.INITIAL_NO; i++) {
        this.addNewChara();
      }

      return;
    }

    // Send the existing characters to the client
    this.sender.emit(Characters.SEND_CHARAS_EVENT, this.islandDoc.characters);
  }

  // TODO: Change the hardcoded MALLACK
  private addNewChara(actorKey: ACTOR_NAMES = ACTOR_NAMES.MALLACK) {
    this.islandDoc.characters.push({
      actorKey,
      workspaceBlockly: ""
    });

    let newChara: CharacterType = this.islandDoc.characters[
      this.islandDoc.characters.length - 1
    ];

    // Send the chara and get it back positioned on the client side
    this.sender.emit(
      Characters.NEW_CHARA_EVENT,
      newChara,
      (position: Characters.CharaPosition) => {
        newChara.position = position;
      }
    );
  }

  // Listen for events coming from the client
  private listenForEvents() {
    this.sender.on(
      Characters.UPDATE_CHARA_EVENT,
      (chara: Characters.DbCharacter) => {
        let charaDbDoc = this.islandDoc.characters.id(chara._id);

        if (charaDbDoc) {
          if (typeof chara.position === "object") {
            charaDbDoc.position = chara.position;
          }

          if (typeof chara.workspaceBlockly === "string") {
            charaDbDoc.workspaceBlockly = chara.workspaceBlockly;
          }
        }
      }
    );
  }
}
