import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import Stats from 'stats.js';

import { createRoom } from './components/Room.js';
import { createDeskSetup } from './components/DeskSetup.js';
import { createPCSetup } from './components/PCSetup.js';
import { createFurniture } from './components/Furniture.js';
import { createLighting } from './components/Lighting.js';
import { createGUI } from './components/GUI.js';
import { setupInteractions } from './components/Interactions.js';

// 1. Scene Setup
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#040508');

// 2. Camera Setup (Isometric Perspective)
const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(7.5, 6.5, 7.5);

// 3. OrbitControls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 1.2, 0);
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.minDistance = 3.5;
controls.maxDistance = 18;
controls.update();

// 4. WebGL Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// 5. Post-Processing (UnrealBloom)
const renderPass = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.35,
  0.4,
  0.88
);

const outputPass = new OutputPass();

const composer = new EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(outputPass);

// 6. Performance Stats
const stats = new Stats();
stats.showPanel(0);
const statsContainer = document.getElementById('stats-container');
if (statsContainer) {
  statsContainer.innerHTML = '';
  statsContainer.appendChild(stats.dom);
  stats.dom.style.position = 'relative';
}

// 7. Build Modernized 3D Room Environment
const room = createRoom();
scene.add(room);

const deskSetup = createDeskSetup();
scene.add(deskSetup);

const pcSetup = createPCSetup();
pcSetup.group.position.set(1.15, 0.95 + 0.68 / 2, -2.7);
scene.add(pcSetup.group);

const furniture = createFurniture();
scene.add(furniture.group);

const lighting = createLighting(scene);

// 8. GUI & Raycasting Interactions
let interactionsHandler = null;

const { gui } = createGUI(lighting, furniture, pcSetup, (preset) => {
  if (interactionsHandler) {
    interactionsHandler.setCameraPreset(preset);
  }
});

// Bloom controls in GUI
const bloomFolder = gui.addFolder('bloom / effects');
bloomFolder.close();
bloomFolder.add(bloomPass, 'strength', 0, 1.5, 0.05).name('bloomStrength');
bloomFolder.add(bloomPass, 'radius', 0, 1.0, 0.05).name('bloomRadius');
bloomFolder.add(bloomPass, 'threshold', 0.5, 1.0, 0.02).name('bloomThreshold');

interactionsHandler = setupInteractions(
  scene,
  camera,
  controls,
  lighting,
  furniture,
  pcSetup
);

// 9. Minimize / Expand Toggle for Quick Bar
const quickBar = document.getElementById('quick-bar');
const quickBarToggle = document.getElementById('quick-bar-toggle');

quickBarToggle?.addEventListener('click', () => {
  quickBar?.classList.toggle('minimized');
});

// Atmosphere Preset Pills UI Event Listeners
const presetPills = document.querySelectorAll('.preset-pill');
presetPills.forEach((pill) => {
  pill.addEventListener('click', (e) => {
    e.stopPropagation();
    presetPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');

    const presetName = pill.getAttribute('data-preset');
    lighting.applyPreset(presetName);
    if (pcSetup && pcSetup.fanLedMat) {
      pcSetup.fanLedMat.color.set(lighting.state.pcColor);
    }
  });
});

// Camera View Pills UI Event Listeners
const camPills = document.querySelectorAll('.cam-pill');
camPills.forEach((pill) => {
  pill.addEventListener('click', (e) => {
    e.stopPropagation();
    camPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');

    const camName = pill.getAttribute('data-cam');
    if (interactionsHandler) {
      interactionsHandler.setCameraPreset(camName);
    }
  });
});

// 10. Window Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  composer.setSize(window.innerWidth, window.innerHeight);
});

// 11. Main Animation Loop
const clock = new THREE.Clock();

function animate() {
  stats.begin();

  const delta = clock.getDelta();

  pcSetup.update(delta);
  furniture.update(delta);
  controls.update();

  composer.render();

  stats.end();
  requestAnimationFrame(animate);
}

animate();
