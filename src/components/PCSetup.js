import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { LiveClockTexture } from '../utils/textures.js';
import { createPaintMaterialTextures } from '../utils/materialTextures.js';

export function createPCSetup() {
  const pcRigGroup = new THREE.Group();
  pcRigGroup.name = 'GamingPCRig';

  // Materials
  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: '#0e1015',
    ...createPaintMaterialTextures({ size: 256 }),
    normalScale: new THREE.Vector2(0.04, 0.04),
    roughness: 0.48,
    metalness: 0.6
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    transmission: 0.96,
    opacity: 1,
    roughness: 0.08,
    thickness: 0.008,
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

  const chassis = new THREE.Group();
  chassis.name = 'PCChassis';
  function addCasePanel(width, height, depth, x, y, z) {
    const panel = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 2, 0.005), blackMetalMat);
    panel.position.set(x, y, z);
    panel.castShadow = true;
    panel.receiveShadow = true;
    chassis.add(panel);
  }
  addCasePanel(CASE_W, 0.022, CASE_D, 0, -CASE_H / 2, 0);
  addCasePanel(CASE_W, 0.022, CASE_D, 0, CASE_H / 2, 0);
  addCasePanel(0.018, CASE_H, CASE_D, CASE_W / 2, 0, 0);
  addCasePanel(CASE_W, CASE_H, 0.018, 0, 0, -CASE_D / 2);
  for (const x of [-CASE_W / 2 + 0.01, CASE_W / 2 - 0.01]) {
    addCasePanel(0.025, CASE_H, 0.025, x, 0, CASE_D / 2);
  }
  pcRigGroup.add(chassis);

  // Tempered Glass Side Panel (Facing left toward desk)
  const glassGeo = new RoundedBoxGeometry(0.01, CASE_H - 0.05, CASE_D - 0.05, 2, 0.01);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.position.set(-CASE_W / 2 - 0.005, 0, 0);
  pcRigGroup.add(glassMesh);

  const screwMat = new THREE.MeshStandardMaterial({ color: '#6b7078', metalness: 0.9, roughness: 0.32 });
  const screwGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.015, 8);
  for (const y of [-0.29, 0.29]) {
    for (const z of [-0.29, 0.29]) {
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.rotation.z = Math.PI / 2;
      screw.position.set(-CASE_W / 2 - 0.011, y, z);
      pcRigGroup.add(screw);
    }
  }

  const boardMat = new THREE.MeshStandardMaterial({ color: '#18232a', roughness: 0.65, metalness: 0.15 });
  const motherboard = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.43, 0.42), boardMat);
  motherboard.position.set(0.145, 0.06, -0.02);
  pcRigGroup.add(motherboard);
  const cpu = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.115, 0.115, 2, 0.008), screwMat);
  cpu.position.set(0.09, 0.12, -0.04);
  pcRigGroup.add(cpu);
  for (let fin = 0; fin < 8; fin++) {
    const heatsink = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.003, 0.12), screwMat);
    heatsink.position.set(0.04, 0.08 + fin * 0.012, -0.04);
    pcRigGroup.add(heatsink);
  }

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

  const cableMat = new THREE.MeshStandardMaterial({ color: '#15171c', roughness: 0.82 });
  for (let cable = 0; cable < 3; cable++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.08, -0.09, 0.06 + cable * 0.012),
      new THREE.Vector3(-0.04, -0.15, 0.12 + cable * 0.012),
      new THREE.Vector3(-0.03, -0.24, 0.03 + cable * 0.012),
      new THREE.Vector3(0.12, -0.28, -0.1)
    ]);
    pcRigGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.004, 6, false), cableMat));
  }

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
