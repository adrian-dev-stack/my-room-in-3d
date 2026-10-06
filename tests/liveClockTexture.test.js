import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';
import { LiveClockTexture } from '../src/utils/textures.js';

describe('Live clock texture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-06T10:59:59.000'));
    vi.stubGlobal('document', { createElement: () => createCanvas(1, 1) });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('uploads only when the colon or displayed time changes', () => {
    const clock = new LiveClockTexture();
    const initialVersion = clock.texture.version;
    clock.update();
    vi.advanceTimersByTime(499);
    clock.update();
    expect(clock.texture.version).toBe(initialVersion);

    vi.advanceTimersByTime(1);
    clock.update();
    expect(clock.texture.version).toBe(initialVersion + 1);

    vi.advanceTimersByTime(500);
    clock.update();
    expect(clock.texture.version).toBe(initialVersion + 2);
    expect(clock.displayState).toBe('11:0:0');
  });
});
