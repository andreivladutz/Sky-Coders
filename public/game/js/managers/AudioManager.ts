import Manager from "./Manager";
import CST, { AudioConfig } from "../CST";
import Actor from "../gameObjects/Actor";
import IsoSpriteObject from "../gameObjects/IsoSpriteObject";
import CameraManager from "./CameraManager";

import Phaser from "phaser";
import Scene = Phaser.Scene;
import BaseSound = Phaser.Sound.BaseSound;
import SoundConfig = Phaser.Types.Sound.SoundConfig;
import Circle = Phaser.Geom.Circle;

const { AUDIO } = CST;

type ActorFootsteps = {
  actor: Actor;
  footstepsSounds: BaseSound[];
  active: boolean;
  // The current footstep sound playing
  currIndex?: number;
  // Number of functions playing these sounds at this moment in time
  // This is needed to prevent the same sounds from playing multiple times
  // (This race condition happens when the sounds become inactive but
  // before the functions playing these sounds stop,
  // they become active again and a new set of functions start playing the exact same sounds)
  functionsPlayingSounds?: number;
};

export default class AudioManager extends Manager {
  public isInited = false;

  private scene: Scene;
  private soundTrack: BaseSound;
  // Keep a dictionary of ui sounds
  private uiSounds: { [soundKey: string]: BaseSound } = {};
  // Multiple actors can play the footsteps sound at the same time
  private actorsFootsteps: ActorFootsteps[] = [];
  // Keep a reference to each object currently playing a sound
  private objectsPlayingSounds: Set<IsoSpriteObject> = new Set<
    IsoSpriteObject
  >();

  // Reuse the same cameraArea
  private cameraArea: Circle = new Circle();
  private cameraManager: CameraManager;

  // Make sure we init only once
  public init() {
    if (this.isInited) {
      return;
    }

    this.isInited = true;

    this.cameraManager = CameraManager.getInstance();
    let scene = this.cameraManager.scene;

    scene.events.on("render", this.adjustObjectsSounds, this);
    this.scene = scene;

    this.setVolume(CST.AUDIO.DEFAULT_VOLUME);
    this.playSoundtrack();
  }

  // The environment sound created by game objects should be adjusted
  // depending on the current camera position and zoom
  public adjustObjectsSounds() {
    let cameraMgr = CameraManager.getInstance();
    let { x, y } = cameraMgr.getWorldPointAtCenter();
    let viewRadius = cameraMgr.camera.worldView.width / 2;

    this.cameraArea.setTo(x, y, viewRadius);

    for (let object of this.objectsPlayingSounds) {
      object.audioComponent.adjustVolume(
        this.cameraArea,
        this.cameraManager.camera.zoom
      );
    }
  }

  public setVolume(volume: number) {
    if (!this.scene) {
      return;
    }

    this.scene.sound.volume = volume;
  }

  // TODO: If in the future we'll have more soundtracks, change the hardcoded 0
  public playSoundtrack(): this {
    if (!this.soundTrack) {
      this.soundTrack = this.scene.sound.add(AUDIO.KEYS.SOUNDTRACKS[0], {
        volume: AUDIO.SOUNDTRACK_VOLUME,
        loop: true
      });
    }

    this.soundTrack.play();

    return this;
  }

  public playUiSound(soundKey: string): this {
    if (!this.scene) {
      return;
    }

    if (!this.uiSounds[soundKey]) {
      let options: SoundConfig;
      // Remove the prefix to search for the key
      let searchKey = soundKey.replace(AUDIO.UI.PREFIX, "");

      for (let sound of AUDIO.UI.FILES) {
        if (sound.KEY === searchKey) {
          options = sound.OPTIONS;
          break;
        }
      }

      this.uiSounds[soundKey] = this.scene.sound.add(soundKey, options);
    }

    this.uiSounds[soundKey].play();

    return this;
  }

  // Play footsteps sounds in order for an actor
  public playFootsteps(actor: Actor): this {
    this.objectsPlayingSounds.add(actor);

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

        // If there is already a set of functions playing these sounds just return and let them play
        if (existingFootsteps.functionsPlayingSounds) {
          return;
        }
      }
    }

    let inactiveSound = existingFootsteps || this.getInactiveFootsteps(actor);

    // Play a footstep sound and once it ends go to the next one
    let playNextFootstep = (actorFootsteps: ActorFootsteps) => {
      if (!actorFootsteps.active) {
        // This set of functions will stop playing the actor sounds
        actorFootsteps.functionsPlayingSounds--;
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

      actor.audioComponent.playSound(sounds[currIndex]);
    };

    inactiveSound.currIndex = 0;
    // A new set of functions will start playing these sounds
    inactiveSound.functionsPlayingSounds = 1;
    playNextFootstep(inactiveSound);

    return this;
  }

  public stopFootsteps(actor: Actor): this {
    this.objectsPlayingSounds.delete(actor);

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
