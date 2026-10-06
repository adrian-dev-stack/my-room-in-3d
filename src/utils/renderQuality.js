export const RENDER_PROFILES = Object.freeze({
  balanced: Object.freeze({ label: 'Balanced', pixelRatio: 1, maxPixels: 1600000, bloom: true, occlusion: false, screenFPS: 8, windowFPS: 8 }),
  smooth: Object.freeze({ label: 'Smooth', pixelRatio: 0.85, maxPixels: 900000, bloom: false, occlusion: false, screenFPS: 8, windowFPS: 6 }),
  high: Object.freeze({ label: 'High', pixelRatio: 1.5, maxPixels: 2800000, bloom: true, occlusion: true, screenFPS: 20, windowFPS: 24 })
});

export function getRenderPixelRatio(quality, width, height, devicePixelRatio = 1) {
  const profile = RENDER_PROFILES[quality] || RENDER_PROFILES.balanced;
  return Math.min(devicePixelRatio, profile.pixelRatio, Math.sqrt(profile.maxPixels / Math.max(1, width * height)));
}

export class RenderQualityController {
  constructor(mode = 'auto') {
    this.setMode(mode);
  }

  setMode(mode) {
    this.mode = ['auto', 'smooth', 'high'].includes(mode) ? mode : 'auto';
    this.quality = this.mode === 'auto' ? 'balanced' : this.mode;
    this.samples = 0;
    this.slowSamples = 0;
  }

  observeFPS(fps) {
    this.samples++;
    if (this.mode !== 'auto' || this.quality === 'smooth' || this.samples <= 5) return false;
    this.slowSamples = fps < 42 ? this.slowSamples + 1 : 0;
    if (this.slowSamples < 3) return false;
    this.quality = 'smooth';
    return true;
  }

  get profile() {
    return RENDER_PROFILES[this.quality];
  }
}
