import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { LiveClockTexture } from '../utils/textures.js';

export function createPCSetup() {
  const pcRigGroup = new THREE.Group();
  pcRigGroup.name = 'GamingPCRig';

  // Materials
  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: '#0e1015',
    roughness: 0.25,
    metalness: 0.85
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    transmission: 0.9,
    opacity: 1,
    transparent: true,
    roughness: 0.05,
    ior: 1.52,
    reflectivity: 0.9
  });

  const fanLedMat = new THREE.MeshBasicMaterial({
    color: '#0082ff' // Blue/cyan front intake rings (photo 3)
  });

  const internalLedMat = new THREE.MeshBasicMaterial({
    color: '#ff0033' // Red internal glow (photo 3)
  });

  // 1. PC Case Chassis
  const CASE_W = 0.36;
  const CASE_H = 0.68;
  const CASE_D = 0.68;

  const caseFrameGeo = new RoundedBoxGeometry(CASE_W, CASE_H, CASE_D, 4, 0.02);
  const caseFrame = new THREE.Mesh(caseFrameGeo, blackMetalMat);
  caseFrame.castShadow = true;
  pcRigGroup.add(caseFrame);

  // Tempered Glass Side Panel (Facing left toward desk)
  const glassGeo = new RoundedBoxGeometry(0.01, CASE_H - 0.05, CASE_D - 0.05, 2, 0.01);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.position.set(-CASE_W / 2 - 0.005, 0, 0);
  pcRigGroup.add(glassMesh);

  // 2. 3x Glowing RGB Front Fans (Photo 3)
  const fanGroup = new THREE.Group();
  const fanRings = [];
  const fanBlades = [];

  for (let i = 0; i < 3; i++) {
    const y = 0.19 - i * 0.19;

    // Glowing Neon Ring
    const ringGeo = new THREE.TorusGeometry(0.068, 0.009, 12, 24);
    const ringMesh = new THREE.Mesh(ringGeo, fanLedMat);
    ringMesh.position.set(0, y, CASE_D / 2 + 0.006);
    fanGroup.add(ringMesh);
    fanRings.push(ringMesh);

    // 3D Aero Fan Blades
    const bladeGroup = new THREE.Group();
    const bladeGeo = new RoundedBoxGeometry(0.016, 0.1, 0.005, 2, 0.002);
    for (let b = 0; b < 4; b++) {
      const blade = new THREE.Mesh(bladeGeo, blackMetalMat);
      blade.rotation.z = (b * Math.PI * 2) / 4;
      bladeGroup.add(blade);
    }
    bladeGroup.position.set(0, y, CASE_D / 2);
    fanGroup.add(bladeGroup);
    fanBlades.push(bladeGroup);
  }
  pcRigGroup.add(fanGroup);

  // 3. Internal Components (GPU & Motherboard with Red LED glow - Photo 3)
  const gpuGeo = new RoundedBoxGeometry(0.12, 0.08, 0.36, 4, 0.01);
  const gpu = new THREE.Mesh(gpuGeo, blackMetalMat);
  gpu.position.set(0.04, -0.08, 0.02);
  gpu.castShadow = true;
  pcRigGroup.add(gpu);

  // Glowing Red Internal Logo / RAM
  const redLedGeo = new RoundedBoxGeometry(0.012, 0.014, 0.32, 2, 0.002);
  const redLed = new THREE.Mesh(redLedGeo, internalLedMat);
  redLed.position.set(-0.025, -0.08, 0.02);
  pcRigGroup.add(redLed);

  for (let r = 0; r < 2; r++) {
    const ramGeo = new RoundedBoxGeometry(0.009, 0.06, 0.016, 2, 0.002);
    const ram = new THREE.Mesh(ramGeo, internalLedMat);
    ram.position.set(0.04, 0.13, -0.04 + r * 0.03);
    pcRigGroup.add(ram);
  }

  // 4. Digital LED Clock on top of PC (Photo 3)
  const clockGroup = new THREE.Group();
  clockGroup.name = 'DigitalClock';

  const liveClock = new LiveClockTexture();
  const clockFaceMat = new THREE.MeshBasicMaterial({ map: liveClock.texture });

  const clockBodyGeo = new RoundedBoxGeometry(0.24, 0.1, 0.08, 4, 0.015);
  const clockBody = new THREE.Mesh(clockBodyGeo, blackMetalMat);
  clockBody.castShadow = true;
  clockGroup.add(clockBody);

  const clockFaceGeo = new THREE.PlaneGeometry(0.22, 0.08);
  const clockFace = new THREE.Mesh(clockFaceGeo, clockFaceMat);
  clockFace.position.set(0, 0, 0.042);
  clockGroup.add(clockFace);

  clockGroup.position.set(0, CASE_H / 2 + 0.055, 0.12);
  pcRigGroup.add(clockGroup);

  // 5. Black Accessory Box / Printer on Cabinet (Next to PC Case - Photo 3)
  const printerGeo = new RoundedBoxGeometry(0.42, 0.22, 0.5, 4, 0.02);
  const printer = new THREE.Mesh(printerGeo, blackMetalMat);
  printer.position.set(0.42, -CASE_H / 2 + 0.11, 0);
  printer.castShadow = true;
  pcRigGroup.add(printer);

  return {
    group: pcRigGroup,
    fanRings,
    fanBlades,
    fanLedMat,
    internalLedMat,
    liveClock,
    update: (delta) => {
      fanBlades.forEach((blade) => {
        blade.rotation.z += delta * 16;
      });
      liveClock.update();
    }
  };
}
