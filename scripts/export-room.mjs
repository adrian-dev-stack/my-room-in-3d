import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas, createCanvas } from '@napi-rs/canvas';
import { validateBytes } from 'gltf-validator';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as MikkTSpace from 'three/examples/jsm/libs/mikktspace.module.js';
import { computeMikkTSpaceTangents } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createRoomModel } from '../src/components/RoomModel.js';
import { RoomCustomizer } from '../src/components/RoomCustomizer.js';

function createBrowserCanvas(width, height) {
  const canvas = createCanvas(width, height);
  // Native canvas's data() method would make GLTFExporter treat it as a DataTexture.
  Object.defineProperty(canvas, 'data', { value: undefined });
  return canvas;
}

globalThis.document = {
  createElement(tag) {
    if (tag !== 'canvas') throw new Error(`Unsupported export element: ${tag}`);
    return createBrowserCanvas(1, 1);
  }
};
globalThis.HTMLCanvasElement = Canvas;
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    // GLTFExporter assigns onloadend after calling readAsArrayBuffer.
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};

function cloneForExport(group) {
  const materials = new Map();
  const textures = new Map();
  const geometries = new Map();
  const srgb = Uint8Array.from({ length: 256 }, (_, value) => {
    const linear = value / 255;
    return Math.round(255 * (linear <= 0.0031308
      ? 12.92 * linear
      : 1.055 * linear ** (1 / 2.4) - 0.055));
  });

  function colorTexture(texture) {
    if (!texture || texture.colorSpace !== THREE.NoColorSpace) return texture;
    if (textures.has(texture)) return textures.get(texture);
    if (!(texture.image instanceof Canvas)) {
      throw new Error('Room color texture must have a canvas image.');
    }
    const canvas = createBrowserCanvas(texture.image.width, texture.image.height);
    const context = canvas.getContext('2d');
    context.drawImage(texture.image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    // glTF color maps use sRGB; the website currently samples these maps as linear.
    for (let i = 0; i < pixels.data.length; i += 4) {
      for (let channel = 0; channel < 3; channel++) {
        pixels.data[i + channel] = srgb[pixels.data[i + channel]];
      }
    }
    context.putImageData(pixels, 0, 0);
    const copy = texture.clone();
    copy.source = new THREE.Source(canvas);
    copy.colorSpace = THREE.SRGBColorSpace;
    textures.set(texture, copy);
    return copy;
  }

  function cloneMaterial(material) {
    if (materials.has(material)) return materials.get(material);
    const copy = material.clone();
    copy.map = colorTexture(material.map);
    copy.emissiveMap = colorTexture(material.emissiveMap);
    materials.set(material, copy);
    return copy;
  }

  function tangentGeometry(geometry) {
    if (geometries.has(geometry)) return geometries.get(geometry);
    const copy = geometry.clone();
    // MikkTSpace preserves normals and UV seams while adding portable glTF tangents.
    computeMikkTSpaceTangents(copy, MikkTSpace, true);
    geometries.set(geometry, copy);
    return copy;
  }

  const copy = group.clone(true);
  copy.traverse((object) => {
    if (!object.isMesh) return;
    object.material = Array.isArray(object.material)
      ? object.material.map(cloneMaterial)
      : cloneMaterial(object.material);
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    if (objectMaterials.some((material) => material.normalMap || material.clearcoatNormalMap)) {
      object.geometry = tangentGeometry(object.geometry);
    }
  });
  return copy;
}

async function exportRoom() {
  await MikkTSpace.ready;
  const { group, room } = createRoomModel();
  new RoomCustomizer(room, null, { createUI: false });
  const model = cloneForExport(group);
  model.updateMatrixWorld(true);
  const exporter = new GLTFExporter();
  exporter.register(() => ({
    writeMaterial(material, definition) {
      const metalRoughTexture = definition.pbrMetallicRoughness?.metallicRoughnessTexture;
      // r165 emits Three's channel field where glTF requires texCoord.
      if (metalRoughTexture && 'channel' in metalRoughTexture) {
        metalRoughTexture.texCoord = metalRoughTexture.channel;
        delete metalRoughTexture.channel;
      }
      const volume = definition.extensions?.KHR_materials_volume;
      // r165 writes Infinity as null; glTF represents infinite attenuation by omission.
      if (volume && material.attenuationDistance === Infinity) {
        delete volume.attenuationDistance;
      }
    }
  }));
  const buffer = await exporter.parseAsync(model, { binary: true });
  const bytes = new Uint8Array(buffer);
  const report = await validateBytes(bytes, {
    uri: 'my-room.glb',
    format: 'glb',
    maxIssues: 0,
    writeTimestamp: false
  });

  if (report.issues.numErrors > 0 || report.issues.numWarnings > 0) {
    const failures = report.issues.messages.filter((issue) => issue.severity <= 1);
    throw new Error(`GLB validation found ${report.issues.numErrors} error(s) and ${report.issues.numWarnings} warning(s):\n${
      failures.slice(0, 10).map((issue) => `${issue.code}: ${issue.message} ${issue.pointer || ''}`).join('\n')
    }`);
  }

  const outputPath = fileURLToPath(new URL('../public/models/my-room.glb', import.meta.url));
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);

  const jsonLength = new DataView(buffer).getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength)));
  console.log(`Exported public/models/my-room.glb (${(bytes.length / 1024 / 1024).toFixed(2)} MB; ${json.meshes.length} meshes; ${json.materials.length} materials; ${json.images.length} embedded textures).`);
  console.log(`Validation: ${report.issues.numErrors} errors, ${report.issues.numWarnings} warnings, ${report.issues.numInfos} informational messages.`);

  const warnings = new Set();
  for (const issue of report.issues.messages) {
    if (issue.severity !== 1 && issue.code !== 'UNSUPPORTED_EXTENSION') continue;
    const warning = `${issue.code}: ${issue.message}`;
    if (!warnings.has(warning)) console.warn(warning);
    warnings.add(warning);
  }
}

exportRoom().catch((error) => {
  console.error(`Room export failed: ${error.message}`);
  process.exitCode = 1;
});
