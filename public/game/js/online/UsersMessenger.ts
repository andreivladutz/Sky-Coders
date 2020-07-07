import Messenger from "./Messenger";
import { Users } from "../../../common/MessageTypes";

/**
 * Class that communicates with a querying instance on the server
 * Use it to get details about all users
 */
export default class UsersMessenger extends Messenger {
  // Get the page count of the leaderboard and the first page of user entries
  public getLeaderboardInit(): Promise<Users.LeaderboardInit> {
    return new Promise(resolve => {
      this.socketManager.emit(
        Users.LEADERB_FIRST,
        (initCfg: Users.LeaderboardInit) => {
          resolve(initCfg);
        }
      );
    });
  }

  /**
   * Listen to communication events
   */
  protected registerEventListening() {
    //this.socketManager.on(
  }
}
