// The first message sent by the server to the client for initialising the game
export namespace GameInit {
  export interface Config {
    seed: string;
  }

  export const EVENT = "game_init";
}

// Redirect event, useful for redirecting the client to another path
export namespace Redirect {
  export const EVENT = "redirect";
  export type Path = string;
}

export namespace GameLoaded {
  export const EVENT = "game_loaded";
}
