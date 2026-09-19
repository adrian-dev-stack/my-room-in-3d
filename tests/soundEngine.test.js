import { describe, it, expect } from 'vitest';
import { SoundEngine } from '../src/utils/soundEngine.js';

describe('SoundEngine Logic', () => {
  it('should initialize with preset channels and default volume', () => {
    const engine = new SoundEngine();
    expect(engine.channels.length).toBeGreaterThanOrEqual(3);
    expect(engine.volume).toBe(0.7);
    expect(engine.isMuted).toBe(false);
    expect(engine.isPlayingMusic).toBe(false);
  });

  it('should return the initial active channel', () => {
    const engine = new SoundEngine();
    const current = engine.getCurrentChannel();
    expect(current).toBeDefined();
    expect(current.name).toBe('Lo-Fi Chill Beats');
    expect(Array.isArray(current.chords)).toBe(true);
  });

  it('should cycle through channels with wrap-around', () => {
    const engine = new SoundEngine();
    const count = engine.channels.length;

    for (let i = 1; i < count; i++) {
      const chan = engine.nextChannel();
      expect(chan).toBe(engine.channels[i]);
    }

    // Wrap around to first channel
    const wrapped = engine.nextChannel();
    expect(wrapped).toBe(engine.channels[0]);
  });

  it('should clamp volume between 0.0 and 1.0', () => {
    const engine = new SoundEngine();

    engine.setVolume(0.5);
    expect(engine.volume).toBe(0.5);

    // Negative clamp
    engine.setVolume(-0.2);
    expect(engine.volume).toBe(0);

    // Exceeding 1.0 clamp
    engine.setVolume(1.8);
    expect(engine.volume).toBe(1);
  });

  it('should toggle mute state cleanly', () => {
    const engine = new SoundEngine();
    expect(engine.isMuted).toBe(false);

    expect(engine.toggleMute()).toBe(true);
    expect(engine.isMuted).toBe(true);

    expect(engine.toggleMute()).toBe(false);
    expect(engine.isMuted).toBe(false);
  });
});
