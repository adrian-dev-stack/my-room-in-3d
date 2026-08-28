import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { AnimatedScreenManager } from '../utils/animatedScreens.js';

export function createDeskSetup() {
  const deskGroup = new THREE.Group();
  deskGroup.name = 'WorkstationDesk';

  // Animated screen manager for live-updating monitor content
  const screenManager = new AnimatedScreenManager();

  // Materials matching photo 3
  const darkWoodDeskMat = new THREE.MeshStandardMaterial({
    color: '#4e1e0d', // Reddish-brown wooden tabletop from photo 3
    roughness: 0.42,
    metalness: 0.06
  });

  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: '#14161d',
    roughness: 0.28,
    metalness: 0.85
  });

  const deskMatMat = new THREE.MeshStandardMaterial({
    color: '#161920', // Black desk mat from photo 3
    roughness: 0.95
  });

  const whitePlasticMat = new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.28
  });

  const headsetBlueMat = new THREE.MeshStandardMaterial({
    color: '#60a5fa', // Light blue headband inner accent
    roughness: 0.4
  });

  const keycapMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.35
  });

  const accentKeyMat = new THREE.MeshStandardMaterial({
    color: '#f43f5e', // RGB key highlights
    roughness: 0.3
  });

  // 1. Desk Surface (Reddish-Brown Wood Tabletop - Photo 3)
  const DESK_W = 2.2;
  const DESK_H = 0.08;
  const DESK_D = 1.05;

  const topGeo = new RoundedBoxGeometry(DESK_W, DESK_H, DESK_D, 4, 0.02);
  const tableTop = new THREE.Mesh(topGeo, darkWoodDeskMat);
  tableTop.position.y = 1.15;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  deskGroup.add(tableTop);

  // Black Steel Desk Legs (Photo 3)
  const legGeo = new RoundedBoxGeometry(0.08, 1.15, DESK_D - 0.1, 2, 0.015);
  const leftLeg = new THREE.Mesh(legGeo, blackMetalMat);
  leftLeg.position.set(-DESK_W / 2 + 0.1, 1.15 / 2, 0);
  leftLeg.castShadow = true;
  deskGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, blackMetalMat);
  rightLeg.position.set(DESK_W / 2 - 0.1, 1.15 / 2, 0);
  rightLeg.castShadow = true;
  deskGroup.add(rightLeg);

  // 2. Black Desk Mat / Mousepad (Photo 3)
  const matGeo = new RoundedBoxGeometry(1.6, 0.01, 0.75, 4, 0.01);
  const deskMat = new THREE.Mesh(matGeo, deskMatMat);
  deskMat.position.set(0.1, 1.15 + DESK_H / 2 + 0.006, 0.05);
  deskMat.receiveShadow = true;
  deskGroup.add(deskMat);

  // 3. Main Center Monitor with Top LED Light Bar (Photo 3)
  const mainMonGroup = new THREE.Group();
  mainMonGroup.name = 'MainMonitor';

  const screenMat = new THREE.MeshBasicMaterial({ map: screenManager.mainTexture });

  const monFrameGeo = new RoundedBoxGeometry(1.36, 0.82, 0.035, 4, 0.008);
  const monFrame = new THREE.Mesh(monFrameGeo, blackMetalMat);
  monFrame.castShadow = true;
  mainMonGroup.add(monFrame);

  const screenGeo = new THREE.PlaneGeometry(1.33, 0.79);
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(0, 0, 0.019);
  mainMonGroup.add(screenMesh);

  // Slim Black LED Light Bar mounted on top (Photo 3)
  const lightBarGroup = new THREE.Group();
  const lightBarBodyGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.88, 16);
  const lightBarBody = new THREE.Mesh(lightBarBodyGeo, blackMetalMat);
  lightBarBody.rotation.z = Math.PI / 2;
  lightBarGroup.add(lightBarBody);

  const lightBarLedGeo = new THREE.BoxGeometry(0.84, 0.006, 0.008);
  const lightBarLedMat = new THREE.MeshBasicMaterial({ color: '#ffb366' });
  const lightBarLed = new THREE.Mesh(lightBarLedGeo, lightBarLedMat);
  lightBarLed.position.set(0, -0.012, 0.005);
  lightBarGroup.add(lightBarLed);

  const mountGeo = new RoundedBoxGeometry(0.04, 0.08, 0.06, 2, 0.004);
  const mount = new THREE.Mesh(mountGeo, blackMetalMat);
  mount.position.set(0, -0.025, -0.025);
  lightBarGroup.add(mount);

  lightBarGroup.position.set(0, 0.43, 0.015);
  mainMonGroup.add(lightBarGroup);

  // Monitor Stand
  const armPoleGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.54, 16);
  const armPole = new THREE.Mesh(armPoleGeo, blackMetalMat);
  armPole.position.set(0, -0.42, -0.12);
  armPole.castShadow = true;
  mainMonGroup.add(armPole);

  const armBaseGeo = new RoundedBoxGeometry(0.24, 0.022, 0.22, 2, 0.005);
  const armBase = new THREE.Mesh(armBaseGeo, blackMetalMat);
  armBase.position.set(0, -0.66, -0.12);
  mainMonGroup.add(armBase);

  mainMonGroup.position.set(0.1, 1.85, -0.2);
  deskGroup.add(mainMonGroup);

  // 4. Vertical Secondary Monitor (Left - Discord Chat - Photo 3)
  const vertMonGroup = new THREE.Group();
  vertMonGroup.name = 'VerticalMonitor';

  const discordScreenMat = new THREE.MeshBasicMaterial({ map: screenManager.vertTexture });

  const vertFrameGeo = new RoundedBoxGeometry(0.68, 1.06, 0.035, 4, 0.008);
  const vertFrame = new THREE.Mesh(vertFrameGeo, blackMetalMat);
  vertFrame.castShadow = true;
  vertMonGroup.add(vertFrame);

  const vertScreenGeo = new THREE.PlaneGeometry(0.65, 1.03);
  const vertScreen = new THREE.Mesh(vertScreenGeo, discordScreenMat);
  vertScreen.position.set(0, 0, 0.019);
  vertMonGroup.add(vertScreen);

  // Vertical Monitor Arm Stand connecting to desk
  const vertArmPoleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.54, 16);
  const vertArmPole = new THREE.Mesh(vertArmPoleGeo, blackMetalMat);
  vertArmPole.position.set(0, -0.54, -0.1);
  vertArmPole.castShadow = true;
  vertMonGroup.add(vertArmPole);

  const vertArmBaseGeo = new RoundedBoxGeometry(0.18, 0.022, 0.18, 2, 0.005);
  const vertArmBase = new THREE.Mesh(vertArmBaseGeo, blackMetalMat);
  vertArmBase.position.set(0, -0.78, -0.1);
  vertMonGroup.add(vertArmBase);

  vertMonGroup.position.set(-1.0, 1.85, -0.12);
  vertMonGroup.rotation.y = 0.24;
  deskGroup.add(vertMonGroup);

  // 5. Backlit Mechanical Keyboard (Photo 3)
  const kbGroup = new THREE.Group();
  kbGroup.name = 'MechanicalKeyboard';

  const kbBaseGeo = new RoundedBoxGeometry(0.52, 0.028, 0.19, 4, 0.008);
  const kbBase = new THREE.Mesh(kbBaseGeo, blackMetalMat);
  kbBase.castShadow = true;
  kbGroup.add(kbBase);

  // Keycaps grid
  const keyGeo = new RoundedBoxGeometry(0.026, 0.014, 0.026, 2, 0.003);
  const keyMeshes = [];
  const rows = 5;
  const cols = 14;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isSpacebar = (r === 0 && c >= 4 && c <= 9);
      if (r === 0 && c > 4 && c <= 9) continue;

      const curKeyGeo = isSpacebar ? new RoundedBoxGeometry(0.18, 0.014, 0.026, 2, 0.003) : keyGeo;
      const isAccent = (r === 4 && c === 0) || (r === 2 && c === 13) || isSpacebar;
      const keyMesh = new THREE.Mesh(curKeyGeo, isAccent ? accentKeyMat.clone() : keycapMat.clone());

      const kx = isSpacebar ? 0 : -0.22 + c * 0.033;
      const kz = 0.06 - r * 0.032;
      keyMesh.position.set(kx, 0.02, kz);
      keyMesh.userData = { initialY: 0.02, isSpacebar };
      kbGroup.add(keyMesh);
      keyMeshes.push(keyMesh);
    }
  }

  kbGroup.position.set(0.07, 1.15 + DESK_H / 2 + 0.02, 0.08);
  deskGroup.add(kbGroup);

  // 6. Gaming Mouse (Photo 3)
  const mouseGroup = new THREE.Group();
  mouseGroup.name = 'GamingMouse';

  const mouseGeo = new RoundedBoxGeometry(0.075, 0.038, 0.12, 4, 0.012);
  const mouseMesh = new THREE.Mesh(mouseGeo, whitePlasticMat);
  mouseMesh.castShadow = true;
  mouseGroup.add(mouseMesh);

  mouseGroup.position.set(0.53, 1.15 + DESK_H / 2 + 0.02, 0.08);
  deskGroup.add(mouseGroup);

  // 7. White Gaming Headset (Resting on Right Side of Desk - Photo 3)
  const headsetGroup = new THREE.Group();
  headsetGroup.name = 'GamingHeadset';

  const bandCurve = new THREE.EllipseCurve(0, 0, 0.09, 0.1, 0, Math.PI, false, 0);
  const bandPoints = bandCurve.getPoints(20);
  const band3D = bandPoints.map((p) => new THREE.Vector3(p.x, p.y, 0));
  const bandSpline = new THREE.CatmullRomCurve3(band3D);
  const bandTube = new THREE.TubeGeometry(bandSpline, 20, 0.015, 8, false);
  const bandMesh = new THREE.Mesh(bandTube, whitePlasticMat);
  headsetGroup.add(bandMesh);

  const innerBandTube = new THREE.TubeGeometry(bandSpline, 20, 0.01, 8, false);
  const innerBandMesh = new THREE.Mesh(innerBandTube, headsetBlueMat);
  innerBandMesh.position.y = -0.005;
  headsetGroup.add(innerBandMesh);

  const cupGeo = new THREE.TorusGeometry(0.042, 0.018, 12, 24);
  const earMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 });

  const earLeft = new THREE.Mesh(cupGeo, earMat);
  earLeft.position.set(-0.1, 0, 0);
  earLeft.rotation.y = Math.PI / 2;
  headsetGroup.add(earLeft);

  const earRight = new THREE.Mesh(cupGeo, earMat);
  earRight.position.set(0.1, 0, 0);
  earRight.rotation.y = Math.PI / 2;
  headsetGroup.add(earRight);

  headsetGroup.position.set(0.72, 1.15 + DESK_H / 2 + 0.04, 0.08);
  headsetGroup.rotation.x = Math.PI / 2;
  headsetGroup.rotation.z = -0.4;
  deskGroup.add(headsetGroup);

  // 8. Desktop Studio Monitor Speakers (Left & Right of Screens)
  const speakerMat = new THREE.MeshStandardMaterial({ color: '#161922', roughness: 0.35, metalness: 0.4 });
  const coneMat = new THREE.MeshStandardMaterial({ color: '#2d3748', roughness: 0.6 });
  const speakerLedMat = new THREE.MeshBasicMaterial({ color: '#00e5ff' });

  function createStudioSpeaker(name, posX, posZ, rotY) {
    const spkGroup = new THREE.Group();
    spkGroup.name = name;

    // Cabinet body
    const bodyGeo = new RoundedBoxGeometry(0.16, 0.28, 0.18, 4, 0.015);
    const bodyMesh = new THREE.Mesh(bodyGeo, speakerMat);
    bodyMesh.castShadow = true;
    spkGroup.add(bodyMesh);

    // Front Baffle Bevel
    const baffleGeo = new RoundedBoxGeometry(0.15, 0.27, 0.02, 2, 0.008);
    const baffleMesh = new THREE.Mesh(baffleGeo, blackMetalMat);
    baffleMesh.position.z = 0.09;
    spkGroup.add(baffleMesh);

    // Tweeter (Top)
    const tweeterGeo = new THREE.SphereGeometry(0.022, 16, 16);
    const tweeterMesh = new THREE.Mesh(tweeterGeo, blackMetalMat);
    tweeterMesh.position.set(0, 0.065, 0.095);
    spkGroup.add(tweeterMesh);

    // Woofer Cone (Bottom)
    const wooferGeo = new THREE.CylinderGeometry(0.046, 0.02, 0.02, 24);
    const wooferMesh = new THREE.Mesh(wooferGeo, coneMat);
    wooferMesh.rotation.x = Math.PI / 2;
    wooferMesh.position.set(0, -0.045, 0.09);
    spkGroup.add(wooferMesh);

    // Glowing Neon Ring around Woofer (Pulsates to Lo-Fi beats)
    const ringGeo = new THREE.TorusGeometry(0.048, 0.004, 12, 32);
    const ringMesh = new THREE.Mesh(ringGeo, speakerLedMat);
    ringMesh.position.set(0, -0.045, 0.102);
    spkGroup.add(ringMesh);

    spkGroup.position.set(posX, 1.15 + DESK_H / 2 + 0.14, posZ);
    spkGroup.rotation.y = rotY;
    return { spkGroup, ringMesh };
  }

  const leftSpeaker = createStudioSpeaker('StudioSpeakerLeft', -0.92, 0.28, 0.32);
  deskGroup.add(leftSpeaker.spkGroup);

  const rightSpeaker = createStudioSpeaker('StudioSpeakerRight', 0.68, -0.16, -0.28);
  deskGroup.add(rightSpeaker.spkGroup);

  // Key press bounce animation
  function pressRandomKey() {
    if (keyMeshes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * keyMeshes.length);
    pressKey(randomIndex);
  }

  function pressKey(index) {
    const mesh = keyMeshes[index];
    if (!mesh) return;

    mesh.position.y = mesh.userData.initialY - 0.009;
    if (mesh.material && mesh.material.emissive) {
      mesh.material.emissive.set('#00e5ff');
      mesh.material.emissiveIntensity = 0.8;
    }

    setTimeout(() => {
      mesh.position.y = mesh.userData.initialY;
      if (mesh.material && mesh.material.emissive) {
        mesh.material.emissive.set('#000000');
        mesh.material.emissiveIntensity = 0;
      }
    }, 90);
  }

  deskGroup.position.set(-0.4, 0, -2.55);

  return {
    group: deskGroup,
    keyMeshes,
    pressKey,
    pressRandomKey,
    speakerLedMat,
    leftSpeaker: leftSpeaker.spkGroup,
    rightSpeaker: rightSpeaker.spkGroup,
    screenManager
  };
}
