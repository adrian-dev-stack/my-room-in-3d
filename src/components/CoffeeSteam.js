import * as THREE from 'three';
import { coffeeSteamVertexShader, coffeeSteamFragmentShader } from '../shaders/coffeeSteamShader.js';

export function createCoffeeSteam(scene, items) {
  const color = '#d2958a';

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: coffeeSteamVertexShader,
    fragmentShader: coffeeSteamFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uTimeFrequency: { value: 0.0004 },
      uUvFrequency: { value: new THREE.Vector2(4, 5) },
      uColor: { value: new THREE.Color(color) }
    }
  });

  const mesh = items.coffeeSteamModel.scene.children[0];
  mesh.material = material;
  scene.add(mesh);

  return {
    mesh,
    material,
    update: (elapsed) => {
      material.uniforms.uTime.value = elapsed;
    }
  };
}
