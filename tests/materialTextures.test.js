import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';
import * as THREE from 'three';
import {
  createWoodMaterialTextures,
  createFabricMaterialTextures,
  createPaintMaterialTextures
} from '../src/utils/materialTextures.js';

function pixels(texture) {
  const canvas = texture.image;
  return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
}

describe('Procedural material textures', () => {
  beforeAll(() => {
    vi.stubGlobal('document', { createElement: () => createCanvas(1, 1) });
  });

  afterAll(() => vi.unstubAllGlobals());

  it('uses color data and linear material data in their correct color spaces', () => {
    const sets = [
      createWoodMaterialTextures({ size: 128 }),
      createFabricMaterialTextures({ size: 128 }),
      createPaintMaterialTextures({ size: 128 })
    ];
    for (const set of sets) {
      if (set.map) expect(set.map.colorSpace).toBe(THREE.SRGBColorSpace);
      expect(set.normalMap.colorSpace).toBe(THREE.NoColorSpace);
      expect(set.roughnessMap.colorSpace).toBe(THREE.NoColorSpace);
      for (const texture of Object.values(set)) {
        expect(texture.wrapS).toBe(THREE.RepeatWrapping);
        expect(texture.wrapT).toBe(THREE.RepeatWrapping);
        expect(texture.generateMipmaps).toBe(true);
        expect(texture.anisotropy).toBe(4);
      }
    }
  });

  it('encodes normalized tangent normals and grayscale roughness, including the green channel', () => {
    for (const set of [
      createWoodMaterialTextures({ size: 128, planks: true }),
      createFabricMaterialTextures({ size: 128 }),
      createPaintMaterialTextures({ size: 128 })
    ]) {
      const normals = pixels(set.normalMap);
      const roughness = pixels(set.roughnessMap);
      for (let index = 0; index < normals.length; index += 4) {
        const x = normals[index] / 255 * 2 - 1;
        const y = normals[index + 1] / 255 * 2 - 1;
        const z = normals[index + 2] / 255 * 2 - 1;
        expect(Math.hypot(x, y, z)).toBeCloseTo(1, 1);
        expect(z).toBeGreaterThan(0);
        expect(normals[index + 3]).toBe(255);
        expect(roughness[index]).toBe(roughness[index + 1]);
        expect(roughness[index + 1]).toBe(roughness[index + 2]);
        expect(roughness[index + 3]).toBe(255);
      }
    }
  });

  it('aligns recessed normal detail and roughness with staggered floorboard joints', () => {
    const size = 256;
    const set = createWoodMaterialTextures({ size, planks: true });
    const color = pixels(set.map);
    const normal = pixels(set.normalMap);
    const roughness = pixels(set.roughnessMap);
    for (const [x, y] of [[128, 16], [64, 48], [192, 48]]) {
      const joint = (y * size + x) * 4;
      const surface = (y * size + x + 4) * 4;
      expect(color[joint]).toBeLessThan(color[surface] * 0.75);
      expect(roughness[joint + 1]).toBeGreaterThan(roughness[surface + 1]);
      expect(normal[joint - 4]).toBeGreaterThan(128);
      expect(normal[joint + 4]).toBeLessThan(128);
    }
  });

  it('reuses expensive texture generation for equivalent options and keeps finishes distinct', () => {
    const wood = createWoodMaterialTextures({ size: 128, color: '#ad7549' });
    expect(createWoodMaterialTextures({ size: 128 })).toBe(wood);
    expect(createWoodMaterialTextures({ size: 128, color: 0xad7549 })).toBe(wood);
    expect(createWoodMaterialTextures({ size: 128, planks: true })).not.toBe(wood);
    expect(createFabricMaterialTextures({ size: 128, color: '#222222' }))
      .not.toBe(createFabricMaterialTextures({ size: 128, color: '#dddddd' }));
    expect(createPaintMaterialTextures({ size: 128 }))
      .toBe(createPaintMaterialTextures({ size: 128 }));
  });
});
