import GameObjectsManager from "./GameObjectsManager";
import GameInstance from "./GameInstance";

import { Characters } from "../../public/common/MessageTypes";
import { ACTOR_NAMES } from "../../public/common/CharacterTypes";
import CST from "../../public/common/CommonCST";

// Handle the game characters for a user
export default class CharactersManager extends GameObjectsManager {
  constructor(gameInstance: GameInstance) {
    super(gameInstance);
  }

  // Get the initial characters from the db that are sent to the client
  public sendCharacters() {
    if (!this.islandDoc.characters || !this.islandDoc.characters.length) {
      this.islandDoc.characters = [];

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
    let newChara: Characters.DbCharacter = {
      actorKey,
      arrayPos: this.islandDoc.characters.length,
      workspaceBlockly: ""
    };

    this.islandDoc.characters.push(newChara);

    // Send the chara and get it back positioned on the client side
    this.sender.emit(
      Characters.NEW_CHARA_EVENT,
      newChara,
      (position: Characters.CharaPosition) => {
        this.islandDoc.characters[newChara.arrayPos].position = position;
        console.log(this.islandDoc);
      }
    );
  }
}
