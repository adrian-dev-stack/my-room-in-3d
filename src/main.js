import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import Stats from 'stats.js';
import WebGL from 'three/examples/jsm/capabilities/WebGL.js';

// 0. Hardware Capability Check
if (!WebGL.isWebGLAvailable()) {
  const warning = document.createElement('div');
  warning.className = 'webgl-fallback-card';
  warning.setAttribute('role', 'alert');
  warning.innerHTML = `
    <div class="webgl-fallback-content">
      <h2>⚠️ WebGL Not Supported or Disabled</h2>
      <p>Your graphics card or browser does not support hardware-accelerated 3D WebGL, or it is currently disabled.</p>
      <p>Please check your browser settings or ensure hardware acceleration is enabled in your system preferences.</p>
    </div>
  `;
  document.body.appendChild(warning);
  throw new Error('WebGL is not supported in this environment');
}

import { createRoom } from './components/Room.js';
import { createDeskSetup } from './components/DeskSetup.js';
import { createPCSetup } from './components/PCSetup.js';
import { createFurniture } from './components/Furniture.js';
import { createLighting } from './components/Lighting.js';
import { createGUI } from './components/GUI.js';
import { setupInteractions } from './components/Interactions.js';
import { createRCCar } from './components/RCCar.js';
import { FirstPersonController } from './components/FirstPersonController.js';
import { SpatialAudioSystem } from './utils/spatialAudio.js';
import { createRoomPet } from './components/RoomPet.js';
import { RoomCustomizer } from './components/RoomCustomizer.js';
import { soundEngine } from './utils/soundEngine.js';
import { WeatherSync } from './utils/weatherSync.js';
import { DustParticles } from './utils/dustParticles.js';

// 1. Scene Setup
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#030407');

// ── Enhanced Depth Fog ──────────────────────────────────────────────────────
scene.fog = new THREE.FogExp2('#06050d', 0.028);

// 2. Camera Setup (Isometric Perspective)
const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(7.5, 6.5, 7.5);

// 3. OrbitControls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
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
renderer.toneMappingExposure = 1.35;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// 5. Post-Processing — Enhanced Bloom
const renderPass = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.52,   // strength (was 0.35)
  0.55,   // radius
  0.82    // threshold (lower = more bloom)
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

// 7. Build 3D Room Environment
const room = createRoom();
scene.add(room.group);

const deskSetup = createDeskSetup(soundEngine);
scene.add(deskSetup.group);

const pcSetup = createPCSetup();
pcSetup.group.position.set(1.15, 0.95 + 0.68 / 2, -2.7);
scene.add(pcSetup.group);

const furniture = createFurniture();
scene.add(furniture.group);

const lighting = createLighting(scene);

// RC Cyber Rover
const rcCar = createRCCar(scene, soundEngine);

// First-Person Walkthrough & 3D Positional Audio
const fpsController = new FirstPersonController(camera, canvas, soundEngine);
const spatialAudio = new SpatialAudioSystem(camera, scene, soundEngine);

window.addEventListener('pointerdown', () => spatialAudio.init(), { once: true });
window.addEventListener('keydown', () => spatialAudio.init(), { once: true });

window.addEventListener('fps-mode-change', (e) => {
  controls.enabled = !e.detail.active;
});

// Virtual Cyber Cat Companion
const roomPet = createRoomPet(scene, soundEngine);

// Room Customizer
const customizer = new RoomCustomizer(room, soundEngine);

// ── Ambient Dust Particles ──────────────────────────────────────────────────
const dustParticles = new DustParticles(scene);

// Real-Time Weather & Time Sync
const weatherSync = new WeatherSync();
weatherSync.onUpdate((weatherData) => {
  lighting.syncWithWeather(weatherData);
  if (room && room.animatedWindow) {
    room.animatedWindow.setWeather(weatherData);
  }
  if (weatherData.condition === 'rain' || weatherData.condition === 'snow') {
    soundEngine.setRainState(true);
  } else {
    soundEngine.setRainState(false);
  }
});
weatherSync.init();

// 8. GUI & Raycasting Interactions
let interactionsHandler = null;

const { gui } = createGUI(lighting, furniture, pcSetup, (preset) => {
  if (interactionsHandler) {
    interactionsHandler.setCameraPreset(preset);
  }
});

// Hide debug lil-gui by default
if (gui && gui.domElement) {
  gui.domElement.classList.add('gui-hidden');
}

// Bloom controls in GUI
const bloomFolder = gui.addFolder('bloom / effects');
bloomFolder.close();
bloomFolder.add(bloomPass, 'strength', 0, 2.0, 0.05).name('bloomStrength');
bloomFolder.add(bloomPass, 'radius', 0, 1.0, 0.05).name('bloomRadius');
bloomFolder.add(bloomPass, 'threshold', 0.5, 1.0, 0.02).name('bloomThreshold');

interactionsHandler = setupInteractions(
  scene,
  camera,
  controls,
  lighting,
  furniture,
  pcSetup,
  deskSetup,
  rcCar,
  fpsController,
  roomPet
);

// ── Parallax Camera Micro-Movement ─────────────────────────────────────────
const _mouse = { x: 0, y: 0 };
const _targetOffset = new THREE.Vector3();
let _parallaxActive = false;

window.addEventListener('mousemove', (e) => {
  _mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
  _mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  _parallaxActive = true;
});

// ── RC Drive Button ─────────────────────────────────────────────────────────
const btnRcDrive = document.getElementById('btn-rc-drive');
btnRcDrive?.addEventListener('click', () => {
  soundEngine.playSwitchClick();
  const willBeActive = !rcCar.state.active;
  rcCar.setActive(willBeActive);
});

// ── Rhythm Beat Button ──────────────────────────────────────────────────────
const btnRhythm = document.getElementById('btn-rhythm');
btnRhythm?.addEventListener('click', () => {
  soundEngine.playSwitchClick();
  if (interactionsHandler && interactionsHandler.startRhythmMode) {
    interactionsHandler.startRhythmMode();
  }
});

// ── Room Customizer Drawer ──────────────────────────────────────────────────
const btnCustomizer = document.getElementById('btn-customizer');
btnCustomizer?.addEventListener('click', () => {
  soundEngine.playSwitchClick();
  customizer.toggleDrawer();
});

// Atmosphere Preset Pills
const presetPills = document.querySelectorAll('.preset-pill');
presetPills.forEach((pill) => {
  pill.addEventListener('click', (e) => {
    e.stopPropagation();
    soundEngine.playSwitchClick();
    presetPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');

    const presetName = pill.getAttribute('data-preset');
    lighting.applyPreset(presetName);
    if (pcSetup && pcSetup.fanLedMat) {
      pcSetup.fanLedMat.color.set(lighting.state.pcColor);
    }
  });
});

// Camera View Pills
const camPills = document.querySelectorAll('.cam-pill');
camPills.forEach((pill) => {
  pill.addEventListener('click', (e) => {
    e.stopPropagation();
    soundEngine.playSwitchClick();
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
  bloomPass.setSize(window.innerWidth, window.innerHeight);
});

// ── Hide Loading Splash ─────────────────────────────────────────────────────
// Hide after a short delay to ensure Three.js has rendered at least one frame
let _splashHidden = false;
function hideSplash() {
  if (_splashHidden) return;
  _splashHidden = true;
  const splash = document.getElementById('loading-splash');
  if (splash) {
    setTimeout(() => splash.classList.add('hidden'), 1700);
  }
}

// 11. Main Animation Loop
const clock = new THREE.Clock();
let _frameCount = 0;

function animate() {
  stats.begin();

  const delta = clock.getDelta();
  _frameCount++;

  // Hide splash after a few frames
  if (_frameCount === 4) hideSplash();

  pcSetup.update(delta);
  furniture.update(delta);
  rcCar.update(delta);
  roomPet.update(delta, rcCar);

  // Dust particles
  dustParticles.update(delta);

  if (fpsController.active) {
    fpsController.update(delta);
  } else {
    if (rcCar.state.active) {
      controls.target.lerp(new THREE.Vector3(rcCar.state.posX, rcCar.state.posY + 0.3, rcCar.state.posZ), 0.08);
    }
    controls.update();
  }

  // Parallax micro-movement (subtle, only in orbit mode)
  if (_parallaxActive && !fpsController.active && !rcCar.state.active) {
    _targetOffset.set(
      _mouse.x * 0.18,
      _mouse.y * -0.10,
      0
    );
    // Gently shift camera target for depth illusion
    controls.target.x += (_targetOffset.x - controls.target.x + 0) * delta * 0.5;
  }

  // Update monitor screens
  if (deskSetup && deskSetup.screenManager) {
    deskSetup.screenManager.update(delta);
  }

  // Update animated window (weather)
  if (room && room.animatedWindow) {
    room.animatedWindow.update(delta);
  }

  // Speaker LED visualizer ring pulse
  if (deskSetup && deskSetup.speakerLedMat) {
    if (soundEngine.isPlayingMusic) {
      const audioLevel = soundEngine.getAudioLevel();
      const pulseIntensity = 0.5 + audioLevel * 1.8;
      deskSetup.speakerLedMat.color.setHSL(0.75 + audioLevel * 0.15, 1.0, Math.min(0.8, 0.35 * pulseIntensity));
    } else {
      deskSetup.speakerLedMat.color.set('#6d28d9');
    }
  }

  composer.render();

  stats.end();
  requestAnimationFrame(animate);
}

animate();
