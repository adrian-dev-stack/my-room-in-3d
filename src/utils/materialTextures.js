import * as THREE from 'three';

const textureCache = new Map();
const TAU = Math.PI * 2;

function hash(x, y, seed) {
  let value = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function textureSize(size) {
  if (!Number.isInteger(size) || size < 32 || size > 2048) {
    throw new RangeError('Material texture size must be an integer between 32 and 2048.');
  }
  return size;
}

function colorChannels(color) {
  const hex = new THREE.Color(color).getHex(THREE.SRGBColorSpace);
  return [(hex >>> 16) & 255, (hex >>> 8) & 255, hex & 255];
}

function createTexture(size, colorSpace, name) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.name = name;
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  return { texture, context, image };
}

function finishTexture(target) {
  target.context.putImageData(target.image, 0, 0);
  target.texture.needsUpdate = true;
  return target.texture;
}

function writeColor(pixels, offset, color, shade, warmth = 0) {
  pixels[offset] = color[0] * shade + warmth;
  pixels[offset + 1] = color[1] * shade;
  pixels[offset + 2] = color[2] * shade - warmth * 0.6;
  pixels[offset + 3] = 255;
}

function writeGray(pixels, offset, value) {
  const gray = Math.round(Math.min(1, Math.max(0, value)) * 255);
  pixels[offset] = gray;
  pixels[offset + 1] = gray;
  pixels[offset + 2] = gray;
  pixels[offset + 3] = 255;
}

function tiledNoise(size, columns, rows, seed) {
  const lattice = Float32Array.from({ length: columns * rows }, (_, index) =>
    hash(index % columns, Math.floor(index / columns), seed));
  const field = new Float32Array(size * size);
  const xCells = new Uint16Array(size);
  const xBlends = new Float32Array(size);
  for (let x = 0; x < size; x++) {
    const coordinate = x * columns / size;
    const cell = Math.floor(coordinate);
    const blend = coordinate - cell;
    xCells[x] = cell;
    xBlends[x] = blend * blend * (3 - 2 * blend);
  }
  for (let y = 0; y < size; y++) {
    const coordinate = y * rows / size;
    const cell = Math.floor(coordinate);
    const blend = coordinate - cell;
    const smoothBlend = blend * blend * (3 - 2 * blend);
    const top = (cell % rows) * columns;
    const bottom = ((cell + 1) % rows) * columns;
    for (let x = 0; x < size; x++) {
      const left = xCells[x];
      const right = (left + 1) % columns;
      const a = lattice[top + left] + (lattice[top + right] - lattice[top + left]) * xBlends[x];
      const b = lattice[bottom + left] + (lattice[bottom + right] - lattice[bottom + left]) * xBlends[x];
      field[y * size + x] = a + (b - a) * smoothBlend;
    }
  }
  return field;
}

function normalTexture(height, size, relief, name) {
  const target = createTexture(size, THREE.NoColorSpace, `${name} normal`);
  const pixels = target.image.data;
  const strength = size * relief * 0.5;
  for (let y = 0; y < size; y++) {
    const previousRow = ((y + size - 1) % size) * size;
    const nextRow = ((y + 1) % size) * size;
    const row = y * size;
    for (let x = 0; x < size; x++) {
      const index = row + x;
      const dx = height[row + ((x + 1) % size)] - height[row + ((x + size - 1) % size)];
      const dy = height[nextRow + x] - height[previousRow + x];
      const nx = -dx * strength;
      // Canvas rows run down, whereas tangent-space V runs up with texture.flipY.
      const ny = dy * strength;
      const inverseLength = 1 / Math.sqrt(nx * nx + ny * ny + 1);
      const offset = index * 4;
      pixels[offset] = (nx * inverseLength * 0.5 + 0.5) * 255;
      pixels[offset + 1] = (ny * inverseLength * 0.5 + 0.5) * 255;
      pixels[offset + 2] = (inverseLength * 0.5 + 0.5) * 255;
      pixels[offset + 3] = 255;
    }
  }
  return finishTexture(target);
}

/** Cached texture sets are shared; clone a texture before changing its repeat independently. */
export function createWoodMaterialTextures({ size = 1024, planks = false, color = '#ad7549' } = {}) {
  textureSize(size);
  const rgb = colorChannels(color);
  const key = `wood:${size}:${Boolean(planks)}:${rgb.join(',')}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const name = planks ? 'Oak floorboards' : 'Oak grain';
  const albedo = createTexture(size, THREE.SRGBColorSpace, `${name} color`);
  const roughness = createTexture(size, THREE.NoColorSpace, `${name} roughness`);
  const height = new Float32Array(size * size);
  const grainFlow = tiledNoise(size, 4, 8, 389);
  const broadGrain = tiledNoise(size, 4, 42, 713);
  const fineGrain = tiledNoise(size, 8, 230, 1741);
  const pores = tiledNoise(size, 24, 384, 2773);
  const courses = 8;
  const seamWidth = 1.7 / 1024;

  for (let y = 0; y < size; y++) {
    const v = y / size;
    const course = Math.floor(v * courses);
    const courseV = v * courses - course;
    const stagger = (course % 2) * 0.25;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const index = y * size + x;
      const offset = index * 4;
      const shiftedU = (u + stagger) % 1;
      const board = Math.floor(shiftedU * 2);
      const boardU = shiftedU * 2 - board;
      const boardTone = planks ? 0.92 + hash(board, course, 359) * 0.15 : 1;
      const broad = broadGrain[index];
      const fine = fineGrain[index];
      const flow = (grainFlow[index] - 0.5) * 2.2
        + Math.sin(TAU * u) * Math.sin(TAU * v * 4) * 0.5
        + (planks ? hash(board, course, 2971) * 3 : 0);
      const fiberPhase = TAU * (v * 188 + flow * 4 + broad * 0.3 + fine * 0.12);
      const fiber = (Math.sin(fiberPhase) + 1) * 0.5;
      const growth = Math.max(0, Math.sin(TAU * (v * 48 + flow + broad * 0.08))) ** 12;
      const vessel = Math.max(0, (pores[index] - 0.68) / 0.32) ** 2;
      const fleck = hash(x, y, 9067) - 0.5;

      const knotU = planks ? boardU : u;
      const knotV = planks ? courseV : v;
      const hasKnot = !planks || hash(board, course, 4729) > 0.79;
      let knot = 0;
      let knotRing = 0;
      if (hasKnot) {
        const dx = (knotU - 0.42) / (planks ? 0.16 : 0.12);
        const dy = (knotV - 0.56) / (planks ? 0.18 : 0.026);
        knot = Math.exp(-(dx * dx + dy * dy) * 2);
        knotRing = Math.sin(Math.sqrt(dx * dx + dy * dy) * 16) * knot;
      }

      let seam = 0;
      if (planks) {
        const horizontalDistance = Math.min(courseV, 1 - courseV) / courses;
        const jointDistance = Math.min(boardU, 1 - boardU) / 2;
        seam = Math.max(0, 1 - Math.min(horizontalDistance, jointDistance) / seamWidth);
        seam = seam * seam * (3 - 2 * seam);
      }

      const shade = (0.95 + broad * 0.1 - growth * 0.1 - fiber * 0.032
        - vessel * 0.055 - knot * 0.15 + knotRing * 0.045 + fleck * 0.012)
        * boardTone * (1 - seam * 0.5);
      writeColor(albedo.image.data, offset, rgb, shade, (broad - 0.5) * 5);
      height[index] = broad * 0.008 - growth * 0.007 + fiber * 0.009 - vessel * 0.018
        - knot * 0.012 + knotRing * 0.003 - seam * 0.14 + fleck * 0.001;
      writeGray(roughness.image.data, offset,
        0.68 + (1 - broad) * 0.1 + growth * 0.045 + vessel * 0.07 + seam * 0.14 + fleck * 0.015);
    }
  }

  const result = {
    map: finishTexture(albedo),
    normalMap: normalTexture(height, size, 0.016, name),
    roughnessMap: finishTexture(roughness)
  };
  textureCache.set(key, result);
  return result;
}

export function createFabricMaterialTextures({ size = 512, color = '#555c66' } = {}) {
  textureSize(size);
  const rgb = colorChannels(color);
  const key = `fabric:${size}:${rgb.join(',')}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const albedo = createTexture(size, THREE.SRGBColorSpace, 'Woven fabric color');
  const roughness = createTexture(size, THREE.NoColorSpace, 'Woven fabric roughness');
  const height = new Float32Array(size * size);
  const dye = tiledNoise(size, 8, 8, 661);
  const threadCount = Math.max(8, Math.floor(size / 16) * 2);

  for (let y = 0; y < size; y++) {
    const weaveY = y * threadCount / size;
    const row = Math.floor(weaveY);
    const withinY = weaveY - row;
    const weftRound = Math.sin(withinY * Math.PI) ** 0.75;
    for (let x = 0; x < size; x++) {
      const weaveX = x * threadCount / size;
      const column = Math.floor(weaveX);
      const withinX = weaveX - column;
      const index = y * size + x;
      const offset = index * 4;
      const warpRound = Math.sin(withinX * Math.PI) ** 0.75;
      const warpLift = 0.65 + Math.cos(Math.PI * (column + weaveY)) * 0.35;
      const weftLift = 0.65 - Math.cos(Math.PI * (row + weaveX)) * 0.35;
      const warpHeight = warpRound * warpLift;
      const weftHeight = weftRound * weftLift;
      const warpOnTop = warpHeight > weftHeight;
      const threadHeight = Math.max(warpHeight, weftHeight);
      const fibers = Math.sin(TAU * (warpOnTop ? withinX : withinY) * 3);
      const fleck = hash(x, y, 6911) - 0.5;
      const variation = dye[index] - 0.5;
      height[index] = threadHeight * 0.042 + fibers * 0.0018 + fleck * 0.001;
      writeColor(albedo.image.data, offset, rgb,
        0.9 + threadHeight * 0.105 + variation * 0.035 + fibers * 0.012 + fleck * 0.025);
      writeGray(roughness.image.data, offset,
        0.91 + (1 - threadHeight) * 0.065 + variation * 0.02 + fibers * 0.009);
    }
  }

  const result = {
    map: finishTexture(albedo),
    normalMap: normalTexture(height, size, 0.023, 'Woven fabric'),
    roughnessMap: finishTexture(roughness)
  };
  textureCache.set(key, result);
  return result;
}

export function createPaintMaterialTextures({ size = 512 } = {}) {
  textureSize(size);
  const key = `paint:${size}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const roughness = createTexture(size, THREE.NoColorSpace, 'Paint roughness');
  const height = new Float32Array(size * size);
  const roller = tiledNoise(size, 48, 48, 1907);
  const peel = tiledNoise(size, 112, 112, 3251);
  const fine = tiledNoise(size, 240, 240, 5923);
  for (let index = 0; index < height.length; index++) {
    height[index] = roller[index] * 0.013 + peel[index] * 0.006 + fine[index] * 0.002;
    writeGray(roughness.image.data, index * 4,
      0.83 + roller[index] * 0.095 + peel[index] * 0.025);
  }
  const result = {
    normalMap: normalTexture(height, size, 0.017, 'Paint orange peel'),
    roughnessMap: finishTexture(roughness)
  };
  textureCache.set(key, result);
  return result;
}
