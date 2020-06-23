import IsoSpriteObject from "../gameObjects/IsoSpriteObject";
import BaseSound = Phaser.Sound.BaseSound;
import HTML5AudioSound = Phaser.Sound.HTML5AudioSound;
import WebAudioSound = Phaser.Sound.WebAudioSound;
import Circle = Phaser.Geom.Circle;
import CST from "../CST";

type Sound = WebAudioSound | HTML5AudioSound;

// Sprite Objects have this audio component so they can play different sounds
export default class AudioComponent {
  public parentObject: IsoSpriteObject;
  // The current playing sounds
  private soundsPlaying: Set<Sound> = new Set<Sound>();

  public constructor(parent: IsoSpriteObject) {
    this.parentObject = parent;
  }

  // Add the sound to the set of sounds and remove it once it finishes playing
  public playSound(sound: BaseSound) {
    this.soundsPlaying.add(sound as Sound);

    sound.once("complete", () => {
      this.soundsPlaying.delete(sound as Sound);
    });

    sound.play();
  }

  // Adjust the volume of this audio component by checking if the object is inside
  // The camera area and compute the volume by distance from the center and zoom value
  public adjustVolume(cameraArea: Circle, zoom: number): this {
    // Get the world position of the parent object
    let { x, y } = this.parentObject;

    // If the object is out of the audible area lower the volume until it stops
    if (!cameraArea.contains(x, y)) {
      return this.lowerVolumeAll();
    }

    let dist = Phaser.Math.Distance.Between(x, y, cameraArea.x, cameraArea.y);
    let maxDist = cameraArea.radius;
    let normalizedSound =
      1 - this.insideAudibleAreaRadius(zoom, dist, maxDist) / maxDist;

    this.setVolumeAll(
      Phaser.Math.Easing.Sine.In(normalizedSound) * this.mapZoomToVolume(zoom)
    );
  }

  // Map the zoom value to the volume multiplier interval
  // To mimick the distancing from the sound source
  private mapZoomToVolume(zoom: number) {
    // Map the zoom to [0, 1]
    let normalizedZoom =
      (zoom - CST.CAMERA.MIN_ZOOM) /
      (CST.CAMERA.MAX_ZOOM - CST.CAMERA.MIN_ZOOM);

    let volMin = CST.AUDIO.ENVIRONMENT_VOL_MIN,
      volMax = CST.AUDIO.ENVIRONMENT_VOL_MAX;
    // Map the normalizedZoom value to [volMin, volMax]
    return normalizedZoom * (volMax - volMin) + volMin;
  }

  // A smaller zoom of the camera determines a larger area of audible sound
  private insideAudibleAreaRadius(
    zoom: number,
    distance: number,
    maxDist: number
  ) {
    // Map the zoom from MIN_ZOOM, MAX_ZOOM to its opposite in [0, 1] and then to [0, 1]
    // Such that MAX_ZOOM becomes 0 and MIN_ZOOM becomes 1
    let radius =
      (CST.CAMERA.MAX_ZOOM - zoom) /
      (CST.CAMERA.MAX_ZOOM - CST.CAMERA.MIN_ZOOM);

    let radiusInterval = CST.AUDIO.AUDIBLE_AREA_RADIUS;

    radius =
      radius * (radiusInterval.MAX - radiusInterval.MIN) + radiusInterval.MIN;

    radius *= maxDist;

    return Math.max(0, distance - radius);
  }

  private setVolumeAll(volume: number): this {
    for (let sound of this.soundsPlaying) {
      sound.setVolume(volume);
    }

    return this;
  }

  private lowerVolumeAll(): this {
    for (let sound of this.soundsPlaying) {
      sound.volume = Phaser.Math.Clamp(
        sound.volume - CST.AUDIO.LOWER_VOLUME_RATE,
        0,
        CST.AUDIO.ENVIRONMENT_VOL_OUTOF_AREA
      );
    }

    return this;
  }
}
