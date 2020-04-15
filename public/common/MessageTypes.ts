export namespace GameInit {
  // The first message sent by the server to the client for initialising the game
  export interface Config {
    seed: string;
  }

  export type ackFunc = (cfg: Config) => void;

  export const EVENT = "game_init";
}
