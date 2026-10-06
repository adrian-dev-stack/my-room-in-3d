import { describe, expect, it } from 'vitest';
import { getRenderPixelRatio, RenderQualityController } from '../src/utils/renderQuality.js';

describe('Render quality', () => {
  it('limits physical pixel work on high DPI and large displays', () => {
    const pixelRatio = getRenderPixelRatio('balanced', 3840, 2160, 3);
    expect(3840 * 2160 * pixelRatio ** 2).toBeCloseTo(1600000);
    expect(getRenderPixelRatio('high', 800, 600, 2)).toBe(1.5);
    expect(getRenderPixelRatio('balanced', 390, 844, 1)).toBe(1);
  });

  it('waits through startup and requires sustained slow frames before adapting', () => {
    const controller = new RenderQualityController();
    for (let sample = 0; sample < 5; sample++) expect(controller.observeFPS(10)).toBe(false);
    expect(controller.quality).toBe('balanced');
    controller.observeFPS(30);
    controller.observeFPS(60);
    controller.observeFPS(30);
    controller.observeFPS(30);
    expect(controller.quality).toBe('balanced');
    expect(controller.observeFPS(30)).toBe(true);
    expect(controller.quality).toBe('smooth');
    for (let sample = 0; sample < 20; sample++) controller.observeFPS(60);
    expect(controller.quality).toBe('smooth');
  });

  it('honors manual quality modes and restarts Auto sampling on demand', () => {
    const controller = new RenderQualityController('high');
    for (let sample = 0; sample < 20; sample++) controller.observeFPS(10);
    expect(controller.quality).toBe('high');
    controller.setMode('smooth');
    expect(controller.profile.bloom).toBe(false);
    controller.setMode('auto');
    expect(controller.quality).toBe('balanced');
    expect(controller.samples).toBe(0);
  });
});
