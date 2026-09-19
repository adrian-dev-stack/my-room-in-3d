import * as THREE from 'three';

/**
 * SpatialAudio - 3D Positional Audio System
 * Uses Three.js AudioListener and PositionalAudio nodes to project
 * sound in real 3D space from the studio speakers and standing fan.
 */

export class SpatialAudioSystem {
  constructor(camera, scene, soundEngine) {
    this.camera = camera;
    this.scene = scene;
    this.soundEngine = soundEngine;

    this.listener = null;
    this.speakerLeftAudio = null;
    this.speakerRightAudio = null;
    this.fanAudio = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return;

    this.soundEngine.init();
    if (!this.soundEngine.ctx) return;

    try {
      this.listener = new THREE.AudioListener();
      // Share soundEngine's active AudioContext
      this.listener.context = this.soundEngine.ctx;
      this.camera.add(this.listener);

      // 1. Left Studio Speaker
      const spkLeft = this.scene.getObjectByName('StudioSpeakerLeft');
      if (spkLeft) {
        this.speakerLeftAudio = new THREE.PositionalAudio(this.listener);
        this.speakerLeftAudio.setRefDistance(1.8);
        this.speakerLeftAudio.setMaxDistance(9.0);
        this.speakerLeftAudio.setRolloffFactor(1.1);
        spkLeft.add(this.speakerLeftAudio);
      }

      // 2. Right Studio Speaker
      const spkRight = this.scene.getObjectByName('StudioSpeakerRight');
      if (spkRight) {
        this.speakerRightAudio = new THREE.PositionalAudio(this.listener);
        this.speakerRightAudio.setRefDistance(1.8);
        this.speakerRightAudio.setMaxDistance(9.0);
        this.speakerRightAudio.setRolloffFactor(1.1);
        spkRight.add(this.speakerRightAudio);
      }

      // 3. Standing Fan Positional Hum
      const fan = this.scene.getObjectByName('StandingFan');
      if (fan) {
        this.fanAudio = new THREE.PositionalAudio(this.listener);
        this.fanAudio.setRefDistance(1.2);
        this.fanAudio.setMaxDistance(7.0);
        this.fanAudio.setRolloffFactor(1.4);
        fan.add(this.fanAudio);
      }

      this.initialized = true;
    } catch (e) {
      console.warn('Spatial audio initialization deferred:', e);
    }
  }

  update() {
    // PositionalAudio updates automatically with camera transform
  }
}
