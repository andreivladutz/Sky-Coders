import Manager from "./Manager";
import CST, { AudioConfig } from "../CST";
import Scene = Phaser.Scene;
import BaseSound = Phaser.Sound.BaseSound;
import Actor from "../gameObjects/Actor";

const { AUDIO } = CST;

type ActorFootsteps = {
  actor: Actor;
  footstepsSounds: BaseSound[];
  active: boolean;
  // The current footstep sound playing
  currIndex?: number;
};

export default class AudioManager extends Manager {
  private soundTrack: BaseSound;
  // Multiple actors can play the footsteps sound at the same time
  private actorsFootsteps: ActorFootsteps[] = [];

  // TODO: If in the future we'll have more soundtracks, change the hardcoded 0
  public playSoundtrack(scene: Scene): this {
    if (!this.soundTrack) {
      this.soundTrack = scene.sound.add(AUDIO.KEYS.SOUNDTRACKS[0], {
        volume: AUDIO.SOUNDTRACK_VOLUME,
        loop: true
      });
    }

    this.soundTrack.play();

    // TODO: remove
    scene.sound.volume = 0.25;

    return this;
  }

  // Play footsteps sounds in order for an actor
  public playFootsteps(actor: Actor): this {
    // If there are any footstep sound already playing for this actor, get them
    let existingFootsteps = this.getActorsFootsteps(actor);
    if (existingFootsteps) {
      // If there are footsteps already playing, restart the order
      if (existingFootsteps.active) {
        existingFootsteps.currIndex = 0;
        return this;
      }
      // Otherwise activate the footsteps and reuse them
      else {
        existingFootsteps.active = true;
      }
    }

    let inactiveSound = existingFootsteps || this.getInactiveFootsteps(actor);

    // Play a footstep sound and once it ends go to the next one
    let playNextFootstep = (actorFootsteps: ActorFootsteps) => {
      if (!actorFootsteps.active) {
        return;
      }

      let sounds = actorFootsteps.footstepsSounds;
      let currIndex = actorFootsteps.currIndex;
      // Make sure the index doesn't go past the end
      currIndex %= sounds.length;

      actorFootsteps.currIndex = currIndex + 1;

      // Once this sound ends, play the next one in the sounds array
      sounds[currIndex].once(
        "complete",
        playNextFootstep.bind(this, actorFootsteps)
      );
      sounds[currIndex].play();
    };

    inactiveSound.currIndex = 0;
    playNextFootstep(inactiveSound);

    return this;
  }

  public stopFootsteps(actor: Actor): this {
    for (let actorFootsteps of this.actorsFootsteps) {
      if (actorFootsteps.actor === actor) {
        actorFootsteps.active = false;
        return this;
      }
    }

    return this;
  }

  // Check if this actor already has some footsteps inited
  private getActorsFootsteps(actor: Actor): ActorFootsteps {
    for (let footstepsSounds of this.actorsFootsteps) {
      if (footstepsSounds.actor === actor) {
        return footstepsSounds;
      }
    }

    return null;
  }

  private getInactiveFootsteps(actor: Actor): ActorFootsteps {
    // Create a footstep sound for each separate sound
    // if we do not find an object with inactive sounds
    let inactiveSounds: ActorFootsteps = null;

    for (let footstepsSounds of this.actorsFootsteps) {
      if (!footstepsSounds.active) {
        inactiveSounds = footstepsSounds;
        break;
      }
    }

    // Didn't find a set of unused sounds. Create new ones for this actor
    if (!inactiveSounds) {
      let footstepsSounds: BaseSound[] = [];

      for (let key of AUDIO.KEYS.FOOTSTEPS) {
        footstepsSounds.push(
          actor.scene.sound.add(key, {
            volume: AUDIO.FOOTSTEPS_VOLUME,
            rate: AUDIO.FOOTSTEPS_RATE
          })
        );
      }

      inactiveSounds = {
        actor,
        footstepsSounds,
        active: true
      };

      this.actorsFootsteps.push(inactiveSounds);
    } else {
      // If we found an object having inactive sound just reactivate those and use them for this actor
      inactiveSounds.actor = actor;
      inactiveSounds.active = true;
    }

    return inactiveSounds;
  }

  public async preload(load: Phaser.Loader.LoaderPlugin) {
    this.loadResources(load, CST.AUDIO.SOUNDTRACK);
    this.loadResources(load, CST.AUDIO.UI);
    this.loadResources(load, CST.AUDIO.FOOTSTEPS);
  }

  // Load a subcategory of audio files: FOOTSTEPS, SOUNDTRACK, ...
  private loadResources(
    load: Phaser.Loader.LoaderPlugin,
    audioCfg: AudioConfig
  ) {
    load.setPath(audioCfg.PATH).setPrefix(audioCfg.PREFIX);

    for (let { KEY, URLS } of audioCfg.FILES) {
      load.audio(KEY, URLS);
    }

    load.setPath().setPrefix();
  }

  public static getInstance(): AudioManager {
    return super.getInstance() as AudioManager;
  }
}

Manager.subscribeToLoadingPhase(AudioManager);
